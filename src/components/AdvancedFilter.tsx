// components/AdvancedFilter.tsx
import React, { useState } from 'react';
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterField {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange';
  options?: { value: string; label: string }[];
}

export interface FilterValue {
  field: string;
  value: string | string[];
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'between' | 'greaterThan' | 'lessThan';
}

interface AdvancedFilterProps {
  fields: FilterField[];
  onFilterChange: (filters: FilterValue[]) => void;
  onSearchChange: (search: string) => void;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  fields,
  onFilterChange,
  onSearchChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('contains');
  const [filterValue, setFilterValue] = useState<string>('');

  const operators = [
    { value: 'contains', label: 'Contiene' },
    { value: 'equals', label: 'Igual a' },
    { value: 'startsWith', label: 'Empieza con' },
    { value: 'endsWith', label: 'Termina con' },
    { value: 'greaterThan', label: 'Mayor que' },
    { value: 'lessThan', label: 'Menor que' },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleAddFilter = () => {
    if (!selectedField || !filterValue) return;

    const newFilter: FilterValue = {
      field: selectedField,
      value: filterValue,
      operator: selectedOperator as FilterValue['operator'],
    };

    const updatedFilters = [...activeFilters, newFilter];
    setActiveFilters(updatedFilters);
    onFilterChange(updatedFilters);

    // Reset form
    setFilterValue('');
  };

  const handleRemoveFilter = (index: number) => {
    const updatedFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const getFieldLabel = (fieldName: string) => {
    return fields.find(f => f.field === fieldName)?.label || fieldName;
  };

  const getOperatorLabel = (operatorValue: string) => {
    return operators.find(op => op.value === operatorValue)?.label || operatorValue;
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda principal */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter size={20} />
          <span>Filtros</span>
          {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de campo */}
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar campo</option>
              {fields.map((field) => (
                <option key={field.field} value={field.field}>
                  {field.label}
                </option>
              ))}
            </select>

            {/* Selector de operador */}
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {/* Input de valor */}
            <div className="flex gap-2">
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Valor"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleAddFilter}
                disabled={!selectedField || !filterValue}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Filtros activos */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {activeFilters.map((filter, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                >
                  <span>{getFieldLabel(filter.field)}</span>
                  <span className="text-green-500">{getOperatorLabel(filter.operator)}</span>
                  <span>"{filter.value}"</span>
                  <button
                    onClick={() => handleRemoveFilter(index)}
                    className="text-green-700 hover:text-green-900"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};