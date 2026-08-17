import { useState, useEffect, Fragment } from 'react';
import { AutocompleteInput } from '../../components/AutocompleteInput';
import { InputSpreadsheet } from '../../components/InputSpreadsheet';
import { ActionIcon, AppShell, AppShellAside, Autocomplete, Box, Button, Checkbox, Group, Kbd, NumberInput, Select, Table, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { isInRange, isNotEmpty, useForm } from '@mantine/form';
import { randomId, useHotkeys } from '@mantine/hooks';
import { TrashIcon } from '@phosphor-icons/react'
import { app_post } from '../../store';

const STATE_AUTOCOMPLETE_DATA = ["Mới", "Cũ"]

export default function AddItem() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      receiverId: null,
      receivedFromId: null,
      dateOfTransfer: new Date().toISOString().split('T')[0],
      items: [{
        key: randomId(),
        name: "", 
        quantity: 1,
        state: STATE_AUTOCOMPLETE_DATA[0]
      }]
    },
    onSubmitPreventDefault: "always",
    validate: {
      receiverId: (value: string | null, values: any) => {
        return value === null ? true : (value === values.receivedFromId ? "Receiver and Transfer should not be the same person" : null)
      },
      receivedFromId: isNotEmpty(),
      dateOfTransfer: isNotEmpty(),
      items: {
        name: isNotEmpty(),
        quantity: isInRange({ min: 1, max: 999999 }),
        state: isNotEmpty()
      }
    }
  })

  // Autofill
  const [stateAutofill, setStateAutofill] = useState(true);
  const [stateAutofillText, setStateAutofillText] = useState(STATE_AUTOCOMPLETE_DATA[0]);

  // Hotkey for adding rows
  function handleAddRow() {
    const newDefault = {...form.getInitialValues().items[0], key: randomId()}
    newDefault.state = stateAutofillText;
    form.insertListItem('items', newDefault)
  }
  useHotkeys([['mod + a', handleAddRow]])

  // Message
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  const fields = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr 0.5fr 2fr',
      columnGap: '1rem',
      rowGap: '0.75rem',
      alignItems: 'center'
    }}>
      <Text fw={700} size='sm'></Text>
      <Text fw={700} size='sm'>Name<span style={{color: 'var(--mantine-color-error)'}}> *</span></Text>
      <Text fw={700} size='sm'>Quantity<span style={{color: 'var(--mantine-color-error)'}}> *</span></Text>
      <Group>
        <Text fw={700} size='sm'>State<span style={{color: 'var(--mantine-color-error)'}}> *</span></Text>
        <Checkbox 
          label={"Autofill with"} 
          checked={stateAutofill} 
          onChange={(e) => { setStateAutofill(e.currentTarget.checked) }}
          value={stateAutofillText}
        />
        <Select
          data={STATE_AUTOCOMPLETE_DATA}
          value={stateAutofillText}
          onChange={(p) => {setStateAutofillText(p ? p : "")}} 
          disabled={!stateAutofill}
        /> 
      </Group>

      {form.getValues().items.map((item, index) => (
        <Fragment key={item.key}>
          <ActionIcon color="red" onClick={() => form.removeListItem('items', index)}>
            <TrashIcon size={16} />
          </ActionIcon>

          <TextInput
            key={form.key(`items.${index}.name`)}
            {...form.getInputProps(`items.${index}.name`)}
          />

          <NumberInput
            min={1}
            key={form.key(`items.${index}.quantity`)}
            {...form.getInputProps(`items.${index}.quantity`)}
          />

          <Autocomplete
            data={STATE_AUTOCOMPLETE_DATA}
            key={form.key(`items.${index}.state`)}
            {...form.getInputProps(`items.${index}.state`)}
          />
        </Fragment>
      ))}
    </div>
  );


  return (
    <div className='divider-item box' style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
      <div>
        <h1 className="page-title">Add item</h1>
      </div>

      <Group align='end'>
        <AutocompleteInput 
          withAsterisk
          label={"Receiver name"}
          fetchUrl={"/employees/search"}
          labeler={(item: any) => item.name}
          itemer={(item: any) => item.id}
          key={form.key('receiverId')}
          {...form.getInputProps('receiverId')}
        />

        <AutocompleteInput 
          withAsterisk
          label={"Transfer from"}
          fetchUrl={"/employees/search"} 
          labeler={(item: any) => item.name}
          itemer={(item: any) => item.id}
          key={form.key('receivedFromId')}
          {...form.getInputProps('receivedFromId')}
        />

        <DateInput label={"Date of transfer"} 
          key={form.key('dateOfTransfer')}
          {...form.getInputProps('dateOfTransfer')}
        />

        <Group style={{marginLeft: 'auto'}}>
          <Text styles={{ root: { color: isSuccess ? 'green' : 'red' } }}>
            {msg}
          </Text>
          <Button 
          disabled={form.getValues().items.length <= 0}
          onClick={(e) => {
            const res = form.validate();
            if (res.hasErrors) {
              return;
            }

            const item_processed = form.getValues().items.map((row) => {
              const {key, ...rowWithoutKey} = row
              return {
                ...rowWithoutKey,
                "emp_id": String(form.getValues().receiverId),
                "transfer_from": String(form.getValues().receivedFromId),
                "date_of_transfer": form.getValues().dateOfTransfer,
              }
            })
            app_post("/items/add_multi", item_processed)
              .then(() => {
                setIsSuccess(true);
                setMsg("Success");
                form.reset();
              })
              .catch((err) => {   
                setIsSuccess(false);
                setMsg(err);
              })
          }}>
            Submit
          </Button>
        </Group>
      </Group>
          
      {fields}

      <Button style={{marginRight: 'auto'}} onClick={handleAddRow}>
        Add row <span style={{color: '#0000'}}>a</span>
        <Kbd>Ctrl + A</Kbd>
      </Button>
    </div>
  )
}

/*
      <InputSpreadsheet schema={[
        { name: "X",         displayName: "",          type: "delete"                },
        { name: "name",      displayName: "Name",      type: "text"                  },
        { name: "quantity",  displayName: "Qty",       type: "number",  default: "0" },
        { name: "state",     displayName: "State",     type: "text",    default: ""  },
      ]} onChange={setItems} settings={{key: "addItem"}}/>
*/
