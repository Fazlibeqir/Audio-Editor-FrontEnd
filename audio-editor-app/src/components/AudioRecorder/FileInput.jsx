import React from 'react';

const FileInput = React.forwardRef(({ onChange }, ref) => {
  return <input type="file" ref={ref} style={{ display: 'none' }} onChange={onChange} />;
});

export default FileInput;
