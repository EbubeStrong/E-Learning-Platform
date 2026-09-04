import Link from "next/link";
import { navigation } from "@/lib/data/site/navigation";

function NavBar() {
  return (
    <nav className="w-full flex items-center justify-center">
      <ul className="flex items-center gap-4 w-full max-w-[540px] justify-between ">
        {navigation.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-ivory-200 transition-colors hover:text-mocha-500 text-[16px] md:text-[20px] font-semibold"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavBar;