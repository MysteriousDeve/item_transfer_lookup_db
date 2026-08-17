import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader } from '@mantine/core';

export default function LoadingWaiter({ loading, error, children }) {
  if (loading)
    return (<Loader />);
  if (error)
    return (<div>⚠ {error}</div>);
  return children;
}