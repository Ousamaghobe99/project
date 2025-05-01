import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import api from '../libs/apiCall';
import { toast } from 'sonner';
import Loading from '../components/loading';
import Title from '../components/title';
import Input from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MdAdd } from "react-icons/md";
import { IoCheckmark, IoCheckmarkDoneCircle, IoSearchOutline } from 'react-icons/io5';
import { exportToExcel } from "react-json-to-excel";
import { CiExport } from "react-icons/ci";
import DateRange from "../components/date-range";
import { formatCurrency } from '../libs';
import ViewTransaction from '../components/view-transaction';
import AddTransaction from '../components/add-transaction';

const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenView, setIsOpenView] = useState(false);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const startDate = searchParams.get("df") || "";
  const endDate = searchParams.get("dt") || "";

  const handleViewTransaction = (el) => {
    setSelected(el);
    setIsOpenView(true);
  };

  const fetchTransactions = async () => {
    try {
      const URL = `/transactions?df=${startDate}&dt=${endDate}&s=${search}`; // Fixed template literals
      const { data: res } = await api.get(URL);
      setData(res?.data);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        "Something unexpected happened. Try again later."
      );
      if (error?.response?.data?.status === "auth_failed") {
        localStorage.removeItem("user");
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchParams({ df: startDate, dt: endDate, s: search }); // Include search term
    setIsLoading(true);
    await fetchTransactions();
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTransactions();
  }, [startDate, endDate, search]); // Added search to dependencies

  if (isLoading) return <Loading />;

  return (
    <>
    <div className="w-full py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <Title title="Transaction Activity" />

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <DateRange />
          
          <form onSubmit={handleSearch}>
            <div className="w-full flex items-center gap-2 border border-gray-700 dark:text-gray-600 rounded-md px-2 py-2">
              <IoSearchOutline className="text-xl text-gray-600 dark:text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search now..."
                className="outline-none group bg-transparent text-gray-700 dark:text-gray-400 placeholder:text-gray-600"
              />
            </div>
          </form>

          <Button
            onClick={() => setIsOpen(true)}
            className="py-1.5 px-2 rounded text-white bg-black dark:bg-violet-800 flex items-center justify-center gap-2 bottom-1"
          >
            <MdAdd size={22} />
            <span>ADD</span>
          </Button>
          
          <button
            onClick={() => exportToExcel(data, `Transactions ${startDate}-${endDate}`)} // Fixed variable name
            className="flex items-center gap-2 text-black dark:text-gray-300"
          >
            Export <CiExport size={24} />
          </button>
        </div>
      </div>
      <div className='overflow-x-auto mt-5'>
        {data?.length === 0 ? (
          <div className='w-full flex items-center justify-center py-10 text-gray-600 dark:text-gray-700 text-lg'>
            <span>No Transaction history</span>
            </div>
        ) : (
          <>
          <table className='w-full'>
          <thead className='w-full border-b border-gray-300 dark:border-gray-700'>
            <tr className='w-full text-black dark:text-gray-400  text-left'>
              <th className='py-2'>Date</th>
              <th className='py-2 px-2'>Description</th>
              <th className='py-2'>Status</th>
              <th className='py-2'>Source</th>
              <th className='py-2'>Amount</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((item, index) => (
              <tr 
                key={index}
                className='w-full border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-500 hover:bg-gray-300/10 text-sm md:text-base'
              >
                <td className='py-4'>
                  <p className='w-24 md:w-auto'>
                    {new Date(item.createdat).toDateString()}
                  </p>
                </td>
                <td className='py-4 px-2'>
                  <div className='flex flex-col w-56 md:w-auto'>
                    <p className='text-base 2xl:text-lg text-black drk:text-grey-400 line-clamp-2'>
                      {item.description}
                    </p>
                  </div>
                </td>
                <td className='py-4 px-2'>
                  <div className='flex items-centre gap-2'>
                    {item.status === "Pending"&&(
                      <RiProgress3line
                        className='text-amber-600'
                        size={24}
                      />
                  
                    )}
                    {item.status === "Completed" && (
                      <IoCheckmarkDoneCircle
                        className='text-emerald-600'
                        size={24}
                      />
                    )}
                    {item.status === "Rejected" &&(
                      <TiWarning className='text-red-600' size={24}/>
                    
                    )}
                    <span>{item?.status}</span>
                  </div>
                </td>
                <td className='py-4 px-2'>
                    {item?.source}
                </td>
                <td className='py-4 text-black dark:text-gray-400 text-base font-medium'>
                  <span
                    className={`${
                      item?.type === "income"
                      ? "text-emerald-600"
                      : "text-red-600"
                    } text-lg font-bold mgl-1`}
                    >
                      {item?.type === "income"? "+" : "-"}
                    </span>
                    {formatCurrency(item?.amount)}
                </td>
                <td className='py-4 px-2'>
                  <Button
                    onClick={()=> handleViewTransaction(item)}
                    className='outline-none text-violet-600 hover:underline'
                    >
                      View 
                    </Button>

                </td>
              </tr>
            ))}
          </tbody>
          </table>
          </>
        
        )}
        </div>
    </div>
    <AddTransaction
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      refetch={fetchTransactions}
      key={new Date().getTime()}
    />
    <ViewTransaction
      data={selected}
      isOpen={isOpenView}
      setIsOpen={setIsOpenView} 
    />  
  </>
  );
};

export default Transactions;