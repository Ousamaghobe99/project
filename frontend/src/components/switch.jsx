import React, { useState, useEffect } from "react";
import { IoMoonOutline } from 'react-icons/io5';
import { LuSun } from 'react-icons/lu'; // Use LuSun instead of LuSunMoon
import useStore from '../store';

const ThemeSwitch = () => {
    const { theme, setTheme } = useStore((state) => state);
    const [isDarkMode, setIsDarkMode] = useState(theme === "dark");

    // Sync theme with localStorage and apply it to the HTML element
    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDarkMode);
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        setIsDarkMode(!isDarkMode);
        setTheme(newTheme);
    };

    return (
        <button
            onClick={toggleTheme}
            className="focus:outline-none p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle theme"
        >
            {isDarkMode ? (
                <LuSun size={26} className="text-yellow-500" /> // Use LuSun for light mode
            ) : (
                <IoMoonOutline size={26} className="text-gray-700 dark:text-gray-300" /> // Adjust color for dark mode
            )}
        </button>
    );
};

export default ThemeSwitch;