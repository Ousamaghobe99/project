import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { BiTransfer } from "react-icons/bi";
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { MdMoreVert } from "react-icons/md";
import TransitionWrapper from "./wrappers/transition-wrapper";

export default function AccountMenu({ addMoney, transferMoney }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex w-full justify-center rounded-md text-sm font-medium text-gray-600 dark:text-gray-300">
        <MdMoreVert className="h-5 w-5" />
      </MenuButton>

      <TransitionWrapper>
        <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg dark:bg-gray-800 focus:outline-none">
          <div className="px-1 py-1 space-y-1">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={transferMoney}
                  className={`${
                    active ? 'bg-violet-500 text-white' : 'text-gray-700 dark:text-gray-200'
                  } group flex gap-2 w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                >
                  <BiTransfer className="h-4 w-4" />
                  Transfer Funds
                </button>
              )}
            </MenuItem>
            
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={addMoney}
                  className={`${
                    active ? 'bg-violet-500 text-white' : 'text-gray-700 dark:text-gray-200'
                  } group flex gap-2 w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                >
                  <FaMoneyCheckDollar className="h-4 w-4" />
                  Add Money
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </TransitionWrapper>
    </Menu>
  );
}