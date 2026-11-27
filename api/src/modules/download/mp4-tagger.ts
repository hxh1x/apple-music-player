const encoder = new TextEncoder();

export interface Mp4TagOptions {
  title?: string;
  artist?: string;
  albumArtist?: string;
  album?: string;
  year?: string;
  label?: string;
  copyright?: string;
  lyrics?: string;
  trackNumber?: number;
  totalTracks?: number;
  coverArt?: Uint8Array;
}

function u32(val: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, val >>> 0, false);
  return b;
}

function u16(val: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, val & 0xffff, false);
  return b;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((acc, p) => acc + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function box(type: string, ...children: Uint8Array[]): Uint8Array {
  const body = concatBytes(...children);
  const typeBytes = encoder.encode(type);
  return concatBytes(u32(8 + body.length), typeBytes, body);
}

function dataAtom(dataType: number, payload: Uint8Array): Uint8Array {
  // 4-byte type indicator + 4-byte locale (0) + payload
  return box('data', u32(dataType), u32(0), payload);
}

function textAtom(tag: string, value?: string): Uint8Array | null {
  if (!value) return null;
  return box(tag, dataAtom(1, encoder.encode(value)));
}

function buildTrknAtom(track?: number, total?: number): Uint8Array | null {
  if (!track || track <= 0) return null;
  const payload = concatBytes(u16(0), u16(track), u16(total || 0), u16(0));
  return box('trkn', dataAtom(0, payload));
}

function buildCovrAtom(jpeg?: Uint8Array): Uint8Array | null {
  if (!jpeg || jpeg.length < 4) return null;
  // Detect PNG magic header (89 50 4E 47) -> 14, else JPEG -> 13
  const isPng = jpeg[0] === 0x89 && jpeg[1] === 0x50 && jpeg[2] === 0x4e && jpeg[3] === 0x47;
  return box('covr', dataAtom(isPng ? 14 : 13, jpeg));
}

function buildUdta(tags: Mp4TagOptions): Uint8Array {
  const items: Uint8Array[] = [];
  const push = (a: Uint8Array | null) => {
    if (a) items.push(a);
  };

  push(textAtom('\u00A9nam', tags.title));
  push(textAtom('\u00A9ART', tags.artist));
  push(textAtom('aART', tags.albumArtist || tags.artist));
  push(textAtom('\u00A9alb', tags.album));
  push(textAtom('\u00A9day', tags.year));
  push(textAtom('\u00A9wrt', tags.label));
  push(textAtom('cprt', tags.copyright));
  push(textAtom('\u00A9lyr', tags.lyrics));
  push(textAtom('\u00A9too', 'Apple Music JioSaavn Edition'));
  push(buildTrknAtom(tags.trackNumber, tags.totalTracks));
  push(buildCovrAtom(tags.coverArt));

  // hdlr box required inside meta: version+flags(4), pre_defined(4), handler_type('mdir'), reserved(12)
  const hdlr = box(
    'hdlr',
    u32(0),
    u32(0),
    encoder.encode('mdir'),
    encoder.encode('appl'),
    u32(0),
    u32(0),
    new Uint8Array([0])
  );

  const ilst = box('ilst', ...items);
  // meta is a FullBox (4 bytes version/flags before children)
  const meta = box('meta', u32(0), hdlr, ilst);
  return box('udta', meta);
}

const CONTAINER_BOXES = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

function shiftChunkOffsets(buf: Uint8Array, start: number, end: number, delta: number) {
  if (delta === 0) return;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = start;
  while (pos + 8 <= end) {
    const size = dv.getUint32(pos, false);
    if (size < 8 || pos + size > end) break;
    const type = String.fromCharCode(buf[pos + 4], buf[pos + 5], buf[pos + 6], buf[pos + 7]);
    if (type === 'stco') {
      const count = dv.getUint32(pos + 12, false);
      for (let i = 0; i < count; i++) {
        const entryOff = pos + 16 + i * 4;
        if (entryOff + 4 <= pos + size) {
          dv.setUint32(entryOff, (dv.getUint32(entryOff, false) + delta) >>> 0, false);
        }
      }
    } else if (type === 'co64') {
      const count = dv.getUint32(pos + 12, false);
      for (let i = 0; i < count; i++) {
        const entryOff = pos + 16 + i * 8;
        if (entryOff + 8 <= pos + size) {
          const val = dv.getBigUint64(entryOff, false);
          dv.setBigUint64(entryOff, val + BigInt(delta), false);
        }
      }
    } else if (CONTAINER_BOXES.has(type)) {
      shiftChunkOffsets(buf, pos + 8, pos + size, delta);
    }
    pos += size;
  }
}

export function embedMp4Metadata(rawMp4: Uint8Array, tags: Mp4TagOptions): Uint8Array {
  const dv = new DataView(rawMp4.buffer, rawMp4.byteOffset, rawMp4.byteLength);

  // Locate top-level boxes
  let moovStart = -1;
  let moovSize = 0;
  let mdatStart = -1;
  let off = 0;
  while (off + 8 <= rawMp4.length) {
    const size = dv.getUint32(off, false);
    if (size < 8 || off + size > rawMp4.length) break;
    const type = String.fromCharCode(rawMp4[off + 4], rawMp4[off + 5], rawMp4[off + 6], rawMp4[off + 7]);
    if (type === 'moov') {
      moovStart = off;
      moovSize = size;
    } else if (type === 'mdat') {
      mdatStart = off;
    }
    off += size;
  }

  if (moovStart === -1) return rawMp4;

  // Rebuild moov children, replacing any existing udta
  const moovChildren: Uint8Array[] = [];
  let cOff = moovStart + 8;
  const moovEnd = moovStart + moovSize;
  while (cOff + 8 <= moovEnd) {
    const cSize = dv.getUint32(cOff, false);
    if (cSize < 8 || cOff + cSize > moovEnd) break;
    const cType = String.fromCharCode(rawMp4[cOff + 4], rawMp4[cOff + 5], rawMp4[cOff + 6], rawMp4[cOff + 7]);
    if (cType !== 'udta') {
      moovChildren.push(rawMp4.slice(cOff, cOff + cSize));
    }
    cOff += cSize;
  }

  moovChildren.push(buildUdta(tags));
  const newMoov = box('moov', ...moovChildren);
  const delta = newMoov.length - moovSize;

  // If mdat follows moov, shift chunk offsets inside newMoov
  if (mdatStart > moovStart) {
    shiftChunkOffsets(newMoov, 8, newMoov.length, delta);
  }

  return concatBytes(rawMp4.slice(0, moovStart), newMoov, rawMp4.slice(moovEnd));
}
