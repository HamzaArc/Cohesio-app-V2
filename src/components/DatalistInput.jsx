import React from 'react';

function DatalistInput({ id, label, value, onChange, error, options, ...props }) {
  const dataListId = `${id}-list`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={id}
        value={value}
        onChange={onChange}
        className={`mt-1 block w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500`}
        list={dataListId}
        {...props}
      />
      <datalist id={dataListId}>
        {options.map((option, index) => (
          <option key={index} value={option} />
        ))}
      </datalist>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default DatalistInput;