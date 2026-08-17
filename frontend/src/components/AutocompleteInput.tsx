import { useState, useEffect, useRef } from 'react';
import { app_get } from '../store';
import { Select } from '@mantine/core';
import { useApiCache } from '../context/ApiCacheContext';

interface AutocompleteInputProps {
  fetchUrl: string;
  onChangeEx?: (item: any) => void;
  labeler?: CallableFunction;
  itemer?: CallableFunction;
  IField_onChange?: (value: string) => void;
}

export function AutocompleteInput(
  args: AutocompleteInputProps & Select.Props) {

  const {
    fetchUrl,
    onChangeEx,
    itemer,
    labeler,
    IField_onChange,
    ...selectProps
  } = args

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [comboboxAutoList, setComboboxAutoList] = useState<{value: any, label: string, disabled?: boolean}[]>([])
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<number | undefined>(undefined);
  const { cachedFetch, isCached, invalidateEvent } = useApiCache();


  const fetchAutoList = () => {
    clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);

        const data = await cachedFetch(
          fetchUrl,
          () => app_get(`${fetchUrl}?q=${encodeURIComponent("")}`)
        );
        setSuggestions(data);

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, isCached(fetchUrl) ? 0 : 100);

    return () => clearTimeout(debounceRef.current);
  }


  useEffect(() => {
    // The new combobox code
    const autoMap = suggestions.map((item: any, i: number) => {
      return { value: itemer ? itemer(item) : i, label: labeler ? labeler(item) : String(item) }
    });
    setComboboxAutoList(autoMap);
  }, [suggestions])


  useEffect(() => {
    onChangeEx?.(selectedItem);

    const thing = selectedItem ? (selectedItem.id ?? "") : "";
    IField_onChange?.(String(thing));
  }, [selectedItem]);

  // returning fetchAutoList's cleanup fn directly (instead of calling it as a
  // plain statement) so React actually wires it up as this effect's cleanup —
  // cancels any pending debounced fetch if the component unmounts before it fires
  useEffect(() => { console.log("GGGG"); return fetchAutoList() }, [invalidateEvent])

  return (
    <Select
      clearable
      searchable
      clearSectionMode="clear"
      {...selectProps}
      data={comboboxAutoList}
      limit={100}
      loading={loading}
      onChange={(value, option) => {
        console.log(value)
        console.log(option)
        setSelectedItem(value !== null ? (
          itemer ? suggestions.find((v) => itemer(v) === value) : suggestions[Number(value)]
        ) : null);
        selectProps?.onChange?.(value, option);
      }}
      onFocus={(e) => {
        //fetchAutoList();
        selectProps?.onFocus?.(e);
      }}
    />
  );
}