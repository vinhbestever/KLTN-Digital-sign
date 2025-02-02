import WebViewer from '@pdftron/webviewer';
import { Button } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

export const Dashboard = () => {
  const [instance, setInstance] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);

  const viewer = useRef(null);
  const filePicker = useRef(null);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'searchButton',
          'menuButton',
        ],
      },
      viewer.current
    ).then((instance) => {
      filePicker.current.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          instance.UI.loadDocument(file);
        }
      };
    });
  }, []);

  return (
    <div className="App">
      <Button
        onClick={() => {
          if (filePicker) {
            filePicker.current.click();
          }
        }}
      >
        Upload a document
      </Button>
      <input type="file" ref={filePicker} style={{ display: 'none' }} />

      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};
