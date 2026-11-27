const utf8 = new TextEncoder();

export interface Id3TagOptions {
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

function u32be(val: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, val >>> 0, false);
  return b;
}

function syncsafe32(val: number): Uint8Array {
  return new Uint8Array([
    (val >>> 21) & 0x7f,
    (val >>> 14) & 0x7f,
    (val >>> 7) & 0x7f,
    val & 0x7f,
  ]);
}

function encodeUtf16LeWithBom(str: string): Uint8Array {
  const out = new Uint8Array(2 + str.length * 2);
  out[0] = 0xff;
  out[1] = 0xfe;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    out[2 + i * 2] = code & 0xff;
    out[2 + i * 2 + 1] = (code >>> 8) & 0xff;
  }
  return out;
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

function frame(id: string, payload: Uint8Array): Uint8Array {
  // ID3v2.3 frame header: 4-byte ID, 4-byte size (big-endian uint32), 2-byte flags (0, 0)
  return concatBytes(utf8.encode(id), u32be(payload.length), new Uint8Array([0, 0]), payload);
}

function textFrame(id: string, value?: string): Uint8Array | null {
  if (!value) return null;
  // Encoding 0x01 = UTF-16 with BOM
  return frame(id, concatBytes(new Uint8Array([0x01]), encodeUtf16LeWithBom(value)));
}

function usltFrame(lyrics?: string): Uint8Array | null {
  if (!lyrics) return null;
  // Encoding (1=UTF-16) + Language ("eng") + Content descriptor ("" -> 0xFF 0xFE 0x00 0x00) + Lyrics text
  const payload = concatBytes(
    new Uint8Array([0x01]),
    utf8.encode('eng'),
    new Uint8Array([0xff, 0xfe, 0x00, 0x00]),
    encodeUtf16LeWithBom(lyrics)
  );
  return frame('USLT', payload);
}

function apicFrame(cover?: Uint8Array): Uint8Array | null {
  if (!cover || cover.length < 4) return null;
  const isPng = cover[0] === 0x89 && cover[1] === 0x50 && cover[2] === 0x4e && cover[3] === 0x47;
  const mime = utf8.encode(isPng ? 'image/png' : 'image/jpeg');
  // Encoding (0x00=ISO-8859-1) + MIME + 0x00 + Picture type (0x03=Cover front) + Description (0x00) + data
  const payload = concatBytes(
    new Uint8Array([0x00]),
    mime,
    new Uint8Array([0x00, 0x03, 0x00]),
    cover
  );
  return frame('APIC', payload);
}

function stripExistingId3v2(mp3: Uint8Array): Uint8Array {
  if (mp3.length >= 10 && mp3[0] === 0x49 && mp3[1] === 0x44 && mp3[2] === 0x33) {
    const tagSize =
      ((mp3[6] & 0x7f) << 21) |
      ((mp3[7] & 0x7f) << 14) |
      ((mp3[8] & 0x7f) << 7) |
      (mp3[9] & 0x7f);
    const total = 10 + tagSize;
    if (total < mp3.length) return mp3.slice(total);
  }
  return mp3;
}

export function embedMp3Id3Tags(rawMp3: Uint8Array, tags: Id3TagOptions): Uint8Array {
  const frames: Uint8Array[] = [];
  const push = (f: Uint8Array | null) => {
    if (f) frames.push(f);
  };

  push(textFrame('TIT2', tags.title));
  push(textFrame('TPE1', tags.artist));
  push(textFrame('TPE2', tags.albumArtist || tags.artist));
  push(textFrame('TALB', tags.album));
  push(textFrame('TYER', tags.year));
  push(textFrame('TPUB', tags.label));
  push(textFrame('TCOP', tags.copyright));
  push(textFrame('TSSE', 'Apple Music JioSaavn Edition'));
  if (tags.trackNumber && tags.trackNumber > 0) {
    const trackStr = tags.totalTracks
      ? `${tags.trackNumber}/${tags.totalTracks}`
      : String(tags.trackNumber);
    push(textFrame('TRCK', trackStr));
  }
  push(usltFrame(tags.lyrics));
  push(apicFrame(tags.coverArt));

  const body = concatBytes(...frames);
  const header = concatBytes(
    utf8.encode('ID3'),
    new Uint8Array([0x03, 0x00, 0x00]), // ID3v2.3.0, flags=0
    syncsafe32(body.length)
  );

  const audioOnly = stripExistingId3v2(rawMp3);
  return concatBytes(header, body, audioOnly);
}
