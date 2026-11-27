import { NavLink } from "react-router-dom";
import { HomeIcon, LibraryIcon, SearchIcon } from "../icons/AppleIcons";

const MobileNav = () => {
  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1 text-[10px] font-medium transition-colors ${
      isActive ? "text-[#fa243c]" : "text-zinc-500 dark:text-zinc-400"
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#161618]/85 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        <NavLink to="/" end className={itemClass}>
          {({ isActive }) => (
            <>
              <HomeIcon filled={isActive} className="h-5 w-5" />
              <span>Listen Now</span>
            </>
          )}
        </NavLink>
        <NavLink to="/search" className={itemClass}>
          <SearchIcon className="h-5 w-5" />
          <span>Search</span>
        </NavLink>
        <NavLink to="/library" className={itemClass}>
          {({ isActive }) => (
            <>
              <LibraryIcon filled={isActive} className="h-5 w-5" />
              <span>Library</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileNav;
