import { ShoppingCart, UserPlus, LogIn, LogOut, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const user = false;
  const isAdmin = false;

  return (
    <header className="fixed top-0 left-0 w-full bg-white bg-opacity-70 backdrop-blur-md shadow-md z-40 transition-all duration-300 border-b border-slate-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold text-slate-800 items-center space-x-2 flex"
          >
            Rocket Bay
          </Link>

          <nav className="flex flex-wrap items-center gap-4">
            <Link
              to={"/"}
              className="text-slate-700 hover:text-blue-600 transition duration-300 ease-in-out"
            >
              Home
            </Link>
            {user && (
              <Link
                to={"/cart"}
                className="relative group text-slate-700 hover:text-blue-600 transition duration-300 ease-in-out"
              >
                <ShoppingCart
                  className="inline-block mr-1 group-hover:text-blue-600"
                  size={20}
                />
                <span className="hidden sm:inline">Cart</span>
                <span className="absolute -top-2 -left-2 bg-blue-600 text-blue rounded-full px-2 py-0.5 text-xs group-hover:bg-blue-400 transition duration-300 ease-in-out">
                  3
                </span>
              </Link>
            )}

            {isAdmin && (
              <Link className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center">
                <Lock className="inline-block mr-1" size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}

            {user ? (
              <button className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out">
                <LogOut size={18} />
                <span className="hidden sm:inline ml-2">Logout</span>
              </button>
            ) : (
              <>
                <Link
                  to={"/signup"}
                  className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  <UserPlus className="mr-2" size={18} />
                  Sign Up
                </Link>
                <Link
                  to={"/login"}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  <LogIn className="mr-2" size={18} />
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
