import React, { useState } from 'react';

const DragList = () => {
  const [items, setItems] = useState([1,2,3,4]);
  return <div>{items}</div>;
}
