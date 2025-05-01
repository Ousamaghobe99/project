import React from 'react';
import useStore from '../store';
import { useState, useEffect } from 'react';
import { GiCash } from "react-icons/gi";
import { RiVisaLine } from 'react-icons/ri';
import Loading from '../components/loading';
import Title from '../components/title';
import { MdAdd } from 'react-icons/md';
import { toast } from 'sonner'
import api from '../libs/apiCall';
import { MdVerifiedUser } from 'react-icons/md';
import AccountMenu from '../components/account-dialog';
import { formatCurrency, maskAccountNumber } from '../libs';
import { AddAccount } from '../components/add-account';
import AddMoney from '../components/add_money_account';
import TransferMoney from '../components/transfer_money';

const ICONS = {
  cash: (
    <div className='w-12 h-12 bg-rose-600 text-white flex items-center justify-center rounded-full'>
      <GiCash size={26} />
    </div>
  ),
  bankcard: (
    <div className='w-12 h-12 bg-rose-600 text-white flex items-center justify-center rounded-full'>
      <RiVisaLine size={26} />
    </div>
  ),
  d17: (
    <div className='w-12 h-12 bg-rose-600 text-white flex items-center justify-center rounded-full'>
      <GiCash size={26} />
    </div>
  )
};

const accountTypeOrder = ['Credit', 'Savings', 'Investment', 'Loan'];

const Accounts = () => {
  const { user } = useStore((state) => state);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenTransfer, setIsOpenTransfer] = useState(false);
  const [isOpenTopup, setIsOpenTopup] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const { data: res } = await api.get('/account');
      setData(res?.data);
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message);
      if (error?.response?.data?.status === "auth_failed") {
        localStorage.removeItem("user");
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const groupedAccounts = data?.reduce((acc, account) => {
    const type = account.account_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {});

  const handleTransferMoney = (el) => {
    setSelectedAccount(el?.id);
    setIsOpenTransfer(true);
  };

  const handleOpenAddMoney = (el) => {
    setSelectedAccount(el?.id);
    setIsOpenTopup(true);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAccounts();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="w-full py-10">
        <div className="flex items-center justify-between">
          <Title title="Accounts Information" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="py-1.5 px-2 rounded bg-violet-600 text-white flex items-center justify-center gap-2 border border-gray-500"
            >
              <MdAdd size={24} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {data?.length === 0 ? (
          <div className="w-full flex items-center justify-center py-10 text-gray-600 dark:text-gray-400 text-lg">
            <span>No accounts found</span>
          </div>
        ) : (
          <div className="w-full space-y-8 py-6">
            {accountTypeOrder.map((type) => {
              const accounts = groupedAccounts[type];
              if (!accounts || accounts.length === 0) return null;

              return (
                <div key={type} className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {type} Accounts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((acc, index) => (
                      <div
                        key={index}
                        className="w-full h-48 flex gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div>
                          {ICONS[acc.account_name.toLowerCase().replace(' ', '')] ||
                            <div className='w-12 h-12 bg-rose-600 text-white flex items-center justify-center rounded-full'>
                              <GiCash size={26} />
                            </div>
                          }
                        </div>

                        <div className='space-y-2 w-full'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center'>
                              <p className='text-black dark:text-white text-xl font-semibold'>
                                {acc.account_name}
                              </p>
                              <MdVerifiedUser
                                size={20}
                                className='text-emerald-500 ml-1'
                              />
                            </div>
                            <AccountMenu
                              addMoney={() => handleOpenAddMoney(acc)}
                              transferMoney={() => handleTransferMoney(acc)}
                            />
                          </div>

                          <span className='text-gray-600 dark:text-gray-400 text-sm'>
                            {maskAccountNumber(acc.account_number)}
                          </span>

                          <p className='text-xs text-gray-500 dark:text-gray-500'>
                            Created: {new Date(acc.createdat).toLocaleDateString("en-US", {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>

                          <div className='flex items-center justify-between mt-2'>
                            <p className='text-lg font-medium text-gray-800 dark:text-gray-200'>
                              {formatCurrency(acc.account_balance)}
                            </p>
                            <button
                              onClick={() => handleOpenAddMoney(acc)}
                              className='text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors'
                            >
                              Add Funds
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddAccount
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        refetch={fetchAccounts}
        key={new Date().getTime()}
      />

      <AddMoney
        isOpen={isOpenTopup}
        setIsOpen={setIsOpenTopup}
        id={selectedAccount}
        refetch={fetchAccounts}
        key={new Date().getTime() + 1}
      />

      <TransferMoney
        isOpen={isOpenTransfer}
        setIsOpen={setIsOpenTransfer}
        id={selectedAccount}
        refetch={fetchAccounts}
        key={new Date().getTime() + 2}
      />
    </>
  );
};

export default Accounts;