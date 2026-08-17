import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TabbedPager, TabbedPagerRadio } from '../components/TabbedPager';
import ReturnItem from './Dashboard/ReturnItem'
import QueryPage from './Dashboard/QueryPage';
import { AppShell, AppShellAside, Box, Button, TextInput } from '@mantine/core';
import EmployeeManagement from './Dashboard/EmployeeManagement';
import AddItem from './Dashboard/AddItem';
import { SidebarIcon } from '@phosphor-icons/react';
import EditItems from './Dashboard/EditItems';
import { ApiCacheProvider, useApiCache } from '../context/ApiCacheContext';

export default function Dashboard() {
  const [tabIdx, setTabIdx] = useState(0);
  const [collapse, setCollapse] = useState(false);
  const { invalidate } = useApiCache();

  return (
    <AppShell
      navbar={{
        width: '14rem',
        breakpoint: 'sm',
        collapsed: { desktop: collapse, mobile: collapse }
      }}
    >
      <AppShell.Navbar style={{
        padding : '1rem',
        gap: '1.5rem'
      }}>
        <TabbedPagerRadio tabs={["Query", "Employees management", "Add items", "Edit items", "Return items"]}
        activeIndex={tabIdx}
        onChange={(i: number) => {
          setTabIdx(i);
          invalidate('/employees/search');
          console.log("GGGG2");
        }} />
        <Button style={{marginTop: 'auto'}} variant='light' onClick={() => {setCollapse(!collapse)}}>
          <SidebarIcon size={20}/>
        </Button>
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{padding: '1rem'}}>
          <Button variant='light' onClick={() => {setCollapse(!collapse)}}>
            <SidebarIcon size={20}/>
          </Button>
          <TabbedPager activeIndex={tabIdx}>
            <QueryPage />
            <EmployeeManagement />
            <AddItem />
            <EditItems />
            <ReturnItem />
          </TabbedPager>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
