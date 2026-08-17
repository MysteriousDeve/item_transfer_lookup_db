import { useState, useEffect } from 'react';
import { AutocompleteInput } from '../../components/AutocompleteInput';
import { Box, Button, Group, LoadingOverlay, NumberInput, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { isInRange, isNotEmpty, useForm } from '@mantine/form';
import { randomId, useDisclosure, useForceUpdate } from '@mantine/hooks';
import { TrashIcon } from '@phosphor-icons/react'
import { app_get, app_patch } from '../../store';

export default function EditItems() {
  const forceUpdate = useForceUpdate();
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      items: [{
        key: randomId(),
        id: null,
        to_remove: false,
        name: "", 
        quantity: 1,
        state: "",
        transfer_from_id: null,
        date_of_transfer: ""
      }]
    },
    onSubmitPreventDefault: "always",
    validate: {
      items: {
        name: isNotEmpty(),
        quantity: isInRange({ min: 1, max: 999999 }),
        state: (value) => { 
          return value === null || value === undefined ? true : null 
        },
        transfer_from_id: (value: string | null) => {
          return value === null ? true : null
        },
        date_of_transfer: isNotEmpty()
      }
    }
  })

  // Message
  const [visible, handler] = useDisclosure(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [receiverId, setReceiverId] = useState(null);

  const fields = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 0.5fr 2fr 0.75fr 0.75fr', // 'auto 1fr 0.5fr 2fr 0.75fr 0.75fr'
      columnGap: '1rem',
      rowGap: '0.75rem',
      alignItems: 'center'
    }}>
      {/*<TrashIcon size={'1rem'}/>*/}
      <Text fw={700} size='sm'>Name</Text>
      <Text fw={700} size='sm'>Quantity</Text>
      <Text fw={700} size='sm'>State</Text>
      <Text fw={700} size='sm'>Transfer from</Text>
      <Text fw={700} size='sm'>Date of Transfer</Text>

      {form.getValues().items.map((item, index) => (
        <>
          {/*
          <Checkbox 
            color='red'
            onClick={(e) => { forceUpdate() }}
            key={form.key(`items.${index}.to_remove`)}
            {...form.getInputProps(`items.${index}.to_remove`)}
          />
          */}

          <TextInput
            key={form.key(`items.${index}.name`)}
            {...form.getInputProps(`items.${index}.name`)}
            disabled={form.getValues().items[index].to_remove}
            styles={{
              input: {
                color: form.isDirty(`items.${index}.name`) ? 'yellow' : undefined,
              },
            }}
          />

          <NumberInput
            min={1}
            key={form.key(`items.${index}.quantity`)}
            {...form.getInputProps(`items.${index}.quantity`)}
            disabled={form.getValues().items[index].to_remove}
            styles={{
              input: {
                color: form.isDirty(`items.${index}.quantity`) ? 'yellow' : undefined,
              },
            }}
          />

          <TextInput
            key={form.key(`items.${index}.state`)}
            {...form.getInputProps(`items.${index}.state`)}
            disabled={form.getValues().items[index].to_remove}
            styles={{
              input: {
                color: form.isDirty(`items.${index}.state`) ? 'yellow' : undefined,
              },
            }}
          />

          <AutocompleteInput
            fetchUrl={"/employees/search"} 
            labeler={(item: any) => item.name}
            itemer={(item: any) => item.id}
            key={form.key(`items.${index}.transfer_from_id`)}
            {...form.getInputProps(`items.${index}.transfer_from_id`)}
            disabled={form.getValues().items[index].to_remove}

            clearable={form.isDirty(`items.${index}.transfer_from_id`)}
            onClear={() => {
              form.setFieldValue(`items.${index}.transfer_from_id`, form.getInitialValues().items[index].transfer_from_id);
            }}
            styles={{
              input: {
                color: form.isDirty(`items.${index}.transfer_from_id`) ? 'yellow' : undefined,
              },
            }}
          />

          <DateInput 
            placeholder='Select date'
            key={form.key(`items.${index}.date_of_transfer`)}
            {...form.getInputProps(`items.${index}.date_of_transfer`)}
            disabled={form.getValues().items[index].to_remove}
            styles={{
              input: {
                color: form.isDirty(`items.${index}.date_of_transfer`) ? 'yellow' : undefined,
              },
            }}
          />
        </>
      ))}
    </div>
  );


  return (
    <div className='divider-item box' style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
      <div>
        <h1 className="page-title">Edit items</h1>
      </div>

      <Group align='end'>
        <AutocompleteInput 
          label={"Receiver name"}
          fetchUrl={"/employees/search"}
          labeler={(item: any) => item.name}
          onChangeEx={(item) => {
            if (!item) {
              setReceiverId(null);
              return;
            }
            setReceiverId(item.id);
            setMsg("");

            // Load the selected employee data into the form
            handler.open();
            app_get(`/employees/get/${item.id}/items`)
              .then((data: any[]) => {
                data.sort((a, b) => { 
                  return (a.transfer_from as string).localeCompare(b.transfer_from as string) 
                })
                form.setFieldValue("items", data);
                form.setInitialValues(form.getValues());
                console.log(data);
              })
              .catch((res) => {
                setIsSuccess(false);
                setMsg(res);
              })
              .finally(() => {
                handler.close();
              })
          }}
        />

        <Group style={{marginLeft: 'auto'}}>
          <Text styles={{ 
            root: { 
              color: isSuccess ? 'green' : 'red'
            },
          }}>
            {msg}
          </Text>
          {
            receiverId !== null &&           
            <Button variant='outline' onClick={(e) => { form.reset() }}>
              Revert
            </Button>
          }
          <Button
          disabled={receiverId === null || !form.isDirty()}
          onClick={(e) => {
            const res = form.validate();
            if (res.hasErrors) return;

            const item_processed = form.getValues().items.map((row) => {
              return {
                id: row.id,
                name: row.name,
                quantity: row.quantity,
                state: row.state,
                transfer_from: row.transfer_from_id,
                date_of_transfer: row.date_of_transfer
              };
            })

            handler.open();
            app_patch(`/employees/get/${receiverId}/items/edit`, item_processed)
              .then(() => {
                setIsSuccess(true);
                setMsg("Success");
                setReceiverId(null);
                form.setFieldValue("items", []);
                form.setInitialValues(form.getValues());
              })
              .catch((err) => {
                setIsSuccess(false);
                setMsg(String(err));
              })
              .finally(() => {
                handler.close();
              })
          }}>
            {`Submit${
              (()=>{ 
                const delCount = form.getValues().items.reduce((prev, c) => prev + (c.to_remove ? 1 : 0), 0);
                return " " + (delCount > 0 ? `(${delCount} items to be deleted)` : "");
              })()
            }`}
          </Button>
        </Group>
      </Group>

      <Box pos='relative'>
        <LoadingOverlay visible={visible} h={240} />
        { !visible && receiverId !== null && form.getValues().items.length > 0 && fields }
        { !visible && receiverId !== null && form.getValues().items.length <= 0 && <i>This employee does not have any item</i> }
        { !visible && receiverId === null && <p>Select a receiver to get started.</p> }
      </Box>
    </div>
  )
}
