import React, { useState, useEffect } from 'react';
import api from '../libs/apiCall';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { Listbox } from '@headlessui/react';

const CategorySelect = ({ type, onCategoryChange, userId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/categories?type=${type}&userId=${userId}`);
        setCategories(response.data.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
        toast.error('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [type, userId]);

  const handleSelectionChange = (category) => {
    setSelectedCategory(category);
    onCategoryChange(category);
  };

  if (loading) {
    return <p>Loading categories...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Listbox value={selectedCategory} onChange={handleSelectionChange}>
      <div className="relative">
        <Listbox.Button className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 text-left">
          {selectedCategory ? (
            <div className="flex items-center">
              {selectedCategory.icon && (
                <Icon icon={selectedCategory.icon} className="mr-2" />
              )}
              <span>{selectedCategory.name}</span>
            </div>
          ) : (
            <span>Select Category</span>
          )}
        </Listbox.Button>
        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5">
          {categories.map((category) => (
            <Listbox.Option
              key={category.id}
              value={category}
              className={({ active }) =>
                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                  active ? 'bg-blue-600 text-white' : 'text-gray-900'
                }`
              }
            >
              {({ active, selected }) => (
                <>
                  {category.icon && (
                    <Icon
                      icon={category.icon}
                      className={`absolute inset-y-0 left-3 h-5 w-5 ${
                        active ? 'text-white' : 'text-gray-600'
                      }`}
                    />
                  )}
                  <span
                    className={`block truncate ${
                      selected ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {category.name}
                  </span>
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
};

export default CategorySelect;
