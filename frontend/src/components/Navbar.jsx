import { ShoppingCart, UserPlus, LogIn, LogOut, Lock } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const isAdmin = user?.role === "admin";

  // ← selector for cart array
  const cart = useCartStore((state) => state.cart);

  const authBtn = `
    bg-slate-600 hover:bg-slate-700 text-white 
    py-2 px-4 rounded-md flex items-center 
    transition duration-300 ease-in-out
  `.trim();

  const linkTxt = `
    text-slate-700 hover:text-blue-600 
    transition duration-300 ease-in-out
  `.trim();

  return (
    <header className="fixed top-0 left-0 w-full bg-white bg-opacity-70 backdrop-blur-md shadow-md z-40 border-b border-slate-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-slate-800">
          Rocket Bay
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkTxt} ${isActive ? "font-semibold underline" : ""}`
            }
          >
            Home
          </NavLink>
          {user && (
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `relative inline-flex items-center gap-1 ${linkTxt} ${
                  isActive ? "font-semibold underline" : ""
                }`
              }
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                  {cart.length}
                </span>
              )}
            </NavLink>
          )}
          {isAdmin && (
            <Link to="/secret-dashboard" className={authBtn}>
              <Lock size={18} />
              <span className="hidden sm:inline ml-1">Dashboard</span>
            </Link>
          )}
          {user ? (
            <button onClick={logout} className={authBtn}>
              <LogOut size={18} />{" "}
              <span className="hidden sm:inline ml-1">Logout</span>
            </button>
          ) : (
            <>
              <Link to="/signup" className={authBtn}>
                <UserPlus size={18} />{" "}
                <span className="hidden sm:inline ml-1">Sign Up</span>
              </Link>
              <Link to="/login" className={authBtn}>
                <LogIn size={18} />{" "}
                <span className="hidden sm:inline ml-1">Login</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
