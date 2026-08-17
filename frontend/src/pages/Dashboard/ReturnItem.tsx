import { useNavigate } from 'react-router-dom';
import { app_get, app_post } from '../../store';
import { useState, useEffect } from 'react';
import { AutocompleteInput } from '../../components/AutocompleteInput'
import { InputSpreadsheetExt } from '../../components/InputSpreadsheetExt';
import { Button, Flex, Group, Modal, Stack } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import DataTable from '../../components/DataTable';

export default function Dashboard_ReturnItem() {
  // Data and indices
  const [itemsOwnedData, setItemsOwnedData] = useState<Record<string, any> | null>(null);
  const [itemsNotReturned, setItemsNotReturned] = useState<string[]>([]);
  const [itemsReturning, setItemsReturning] = useState<string[]>([]);
  const [confirmationData, setConfirmationData] = useState<Record<string, any>[]>([]);

  // Metadata
  const [returnerId, setReturnerId] = useState<string | null>(null);
  const [dateOfReturn, setDateOfReturn] = useState<string>(new Date().toISOString().split('T')[0]);

  // Debug message
  const initialMessage = "Select the receiver name to get started.";
  const [mes, setMes] = useState(initialMessage);

  // Confirmation modal state
  const [opened, { open, close }] = useDisclosure(false);


  useEffect(() => {
    setItemsNotReturned(itemsOwnedData ? [...Object.keys(itemsOwnedData)] : []);
    setItemsReturning([]);
  }, [itemsOwnedData])

  const moveToReturningButton = (key: string) => (
    <Button style={{
      width: '100%',
      height: '100%',
      border: 'none',
      font: 'inherit',
      boxSizing: 'border-box',
      padding: '8px 16px',
    }} onClick={() => {
      const itemsOwnDup = itemsNotReturned.filter((v) => v != key);
      const itemsRetDup = [...itemsReturning, key];
      setItemsNotReturned(itemsOwnDup);
      setItemsReturning(itemsRetDup);
    }}>{">"}</Button>
  )

  const moveBackButton = (key: string) => (
    <Button style={{
      width: '100%',
      height: '100%',
      border: 'none',
      font: 'inherit',
      boxSizing: 'border-box',
      padding: '8px 16px',
    }} onClick={() => {
      const itemsRetDup = itemsReturning.filter((v) => v != key);
      const itemsOwnDup = [...itemsNotReturned, key];
      setItemsNotReturned(itemsOwnDup);
      setItemsReturning(itemsRetDup);
    }}>{"<"}</Button>
  )

  return (
    <div className='divider-item box' style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      <div>
        <h1 className="page-title">Return items</h1>
      </div>

      <div style={{display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center'}}>
        <AutocompleteInput label="Receiver name" fetchUrl={"/employees/search"} 
        labeler={(item: any) => item.name}
        onChangeEx={(item) => {
          setMes(initialMessage);
          if (item === null) {
            setReturnerId(null);
            setItemsOwnedData(null);
            return;
          }
          setReturnerId(item.id);
          app_get(`/return_log/get/${item.id}`).then((data: any[]) => {
            const data_processed = Object.fromEntries(
              data.map((v: any) => {
                v.state = "";
                v.return_qty = 1;
                return [v.item_id, v];
              })
            );
            setItemsOwnedData(data_processed);
          })
        }}/>

        <DateInput label="Date of return" value={dateOfReturn} onChange={setDateOfReturn as any} />


        {/*
          * Continue button
          * On press: process data and turn on confirmation dialog
          */}
        <Button style={{marginLeft: 'auto'}} disabled={returnerId === null || itemsReturning.length === 0} onClick={(e) => {
          if (returnerId === null || itemsOwnedData === null) {
            return;
          }
          const item_processed = itemsReturning.map((key) => {
            const row = itemsOwnedData[key];
            return {
              name: String(row.name),
              quantity: row.quantity,
              return_qty: row.return_qty,
              return_state: row.state,
              date_of_return: dateOfReturn,
            };
          })
          setConfirmationData(item_processed);
          open();
        }}>
          Continue
        </Button>
      </div>

      <Modal opened={opened} onClose={close} size='auto' title='Confirm return items'>
        <Stack>
          <DataTable data={confirmationData}/>
          <Group justify='end'>
            <Button variant='outline' onClick={() => {close()}}>Back</Button>
            <Button onClick={() => {
              close()
              if (itemsOwnedData !== null) {
                const item_processed = itemsReturning.map((key) => {
                  const row = itemsOwnedData[key];
                  return {
                    item_id: String(row.item_id),
                    quantity: row.return_qty,
                    return_state: row.state,
                    date_of_return: dateOfReturn,
                  };
                })
                app_post("/return_log/add_multi", item_processed);
                setMes("Return form submitted.");
              }
              setReturnerId(null);
              setItemsOwnedData(null);
            }}>Submit</Button>
          </Group>
        </Stack>
      </Modal>

      { itemsOwnedData !== null && (itemsNotReturned.length + itemsReturning.length > 0) &&
        <div style={{display: 'flex', flexDirection: 'row', gap: '2rem'}}>
          <div style={{flex: '35'}}>
            <InputSpreadsheetExt schema={[
              { name: "name",     displayName: "Name",  type: "text" },
              { name: "quantity", displayName: "Qty",   type: "number", default: "1", width: "4rem" },
              { name: "",         type: "custom", custom: moveToReturningButton, width: "2rem" },
            ]} settings={{allowNewRows: false, allowSingleRowDelete: true, readOnly: true}}
            value={itemsOwnedData} views={itemsNotReturned} />
          </div>

          <div style={{flex: '65'}}>
            <InputSpreadsheetExt schema={[
              { name: "",         type: "custom", custom: moveBackButton, width: "2rem" },
              { name: "name",     displayName: "Name",  type: "text", readOnly: true, width: "13rem" },
              { name: "quantity", displayName: "Qty",   type: "number", default: "1", width: "4rem", readOnly: true },
              { name: "return_qty", displayName: "Return\nQty",   type: "number", default: "1", width: "6rem", maxFrom: "quantity" },
              { name: "state",    displayName: "State", type: "text", default: "" },
            ]} settings={{allowNewRows: false, allowSingleRowDelete: true}} 
            value={itemsOwnedData} onEdit={(v: any)=>{setItemsOwnedData(v)}} views={itemsReturning} />
          </div>
        </div>
      }
      { itemsOwnedData !== null && (itemsNotReturned.length + itemsReturning.length <= 0) && 
        <i>Selected employee does not have any item.</i>
      }
      { itemsOwnedData === null && <p>{mes}</p> }
    </div>
  )
}
