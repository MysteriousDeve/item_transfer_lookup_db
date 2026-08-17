import { useState, useEffect, useRef, cloneElement, JSX } from 'react';
import { app_get } from '../store';
import { Table, Button, Textarea, Input, TextInput, NumberInput } from '@mantine/core';

const ITEM_TABLE_DATA_KEY = "itemTableData"

// Spreadsheet that can only grow vertically (by adding more rows)
// Support for extra functionality
// schema: array of column type and descriptions
// value (optional probably): make the spreadsheet manage the external state instead
// TODO integrate this functionality
interface SchemaField {
  name: string;
  displayName?: string,
  type: string;
  default?: unknown;
  custom?: JSX.Element;
}

interface SpreadsheetSettings {
  key: string;
  allowNewRows?: boolean;
  allowSingleRowDelete?: boolean;
  readOnly?: boolean;
}

interface InputSpreadsheetProps {
  schema: SchemaField[];
  onChange: (data: any) => void;
  settings: SpreadsheetSettings;
}

export function InputSpreadsheet({ schema, onChange, settings }: InputSpreadsheetProps) {
  const localStorageKey = settings.key;
  const allowNewRows = settings.allowNewRows ?? true;
  const allowSingleRowDelete = settings.allowSingleRowDelete ?? false;
  const readOnly = settings.readOnly ?? false;

  const loadFromStorage = () => {
    if (!localStorageKey) {
      return undefined
    }
    try {
      var dat = JSON.parse(String(localStorage.getItem(ITEM_TABLE_DATA_KEY + localStorageKey)));
      if (!dat || !(dat instanceof Object)) return undefined;
    }
    catch {
      return undefined;
    }
    return dat;
  }

  const [data, setData] = useState<Record<string, Record<string, string>>>({});

  const addItem = () => {
    const newItem: any = {
      "_id": crypto.randomUUID()
    }
    schema.forEach(e => {
      newItem[e.name] = e.default ?? "";
    })

    setData(prevList => {
      const m: any = {...prevList};
      m[newItem["_id"]] = newItem;
      return m
    });
  };

  const removeItem = (_id: string) => {
    setData(prevList => {
      const newMap: any = {...prevList};
      delete newMap[_id];
      return newMap;
    });
  };

  const setItem = (rowId: string, prop: string, value: any) => {
    if (readOnly) {
      return;
    }
    setData(prevList => {
      const newMap: any = {...prevList};
      newMap[rowId] = {...newMap[rowId]};
      newMap[rowId][prop] = value;
      return newMap;
    })
  }

  useEffect(() => {
    const dat = loadFromStorage() ?? data;
    setData(dat);
    if (Object.keys(dat).length === 0)
    {
      addItem();
    }
  }, []);

  useEffect(() => {
    if (localStorageKey) {
      localStorage.setItem(ITEM_TABLE_DATA_KEY + localStorageKey, JSON.stringify(data));
    }

    const cleaned = Object.entries(data).map(([k, rowData] : [string, any]) => {
      const cleanedRow = Object.fromEntries(
        Object.entries(rowData).filter(([key]) => !key.startsWith("_"))
      );
      return cleanedRow;
    });
    onChange?.(cleaned);
  }, [data])


  // Generate cell elements
  // s: schema for the column
  // k: row key
  function GetColumnCellElement(s: SchemaField, k: string) {
    var elem = null;

    if (s.type === "delete") {
      return <Table.Td key={"_delete_" + k}> 
        <Button disabled={!allowSingleRowDelete && Object.entries(data).length == 1} onClick={() => removeItem(k)}>{s.name}</Button>
      </Table.Td>;
    }
    else if (s.type === "custom" && s.custom ) {  
      elem = cloneElement(s.custom, {
      IField_onChange: (id: string) => { console.log(`Type of id ${id} is: ${typeof id}`); setItem(k, s.name, id); }})
    }
    else {
      // Handle saving state on input change
      const OnChange: any = (val: any) => {
        if (s.type === "number") {
          setItem(k, s.name, val.toString());
          return;
        }
        setItem(k, s.name, val);
      }

      if (s.type == "text") {
        elem = <TextInput value={data[k][s.name] ?? ""} readOnly={readOnly} 
                onChange={(e) => OnChange(e.currentTarget.value)}></TextInput>
      }
      else if (s.type == "number") {
        elem = <NumberInput value={data[k][s.name] ?? ""} readOnly={readOnly} onChange={OnChange}></NumberInput>
      }
      else {
        elem = <Input type={s.type} value={data[k][s.name] ?? ""} readOnly={readOnly} onChange={OnChange}/>
      }
    }
    // Wrap element in td and return
    return <Table.Td key={s.name + k}><div className='cell-wrapper'>{elem}</div></Table.Td>
  }

  function GetColumnCellHeader(s: any) {
    var fixedWidth = s.width;
    var displayText = s.displayName ?? s.name;
    if (s.type === "delete") {
      displayText = "";
      if (!fixedWidth) {
        fixedWidth = "30px";
      }
    }
    if (fixedWidth) {
      return <Table.Th style={{width: fixedWidth}} key={s.name}>{displayText}</Table.Th>
    }
    return <Table.Th key={s.name}>{displayText}</Table.Th>
  }


  return (
    <div>
      <Table className='fixed'>
        <Table.Thead><Table.Tr>{
          schema.map(GetColumnCellHeader)
        }
        </Table.Tr></Table.Thead>

        <Table.Tbody>{
          Object.entries(data).map(([k, rowData]) => (
            <Table.Tr key={k}>{schema.map(s => GetColumnCellElement(s, k))}</Table.Tr>
          ))
        }
        </Table.Tbody>
      </Table>
      {allowNewRows && 
        <Button style={{marginTop: '12px'}} className="button" onClick={() => addItem()}>New row</Button>
      }
    </div>
  );
}
