import {
  CloudUploadOutlined,
  ContainerFilled,
  SignatureFilled,
} from '@ant-design/icons';
import { Button, Steps } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import WebViewer from '@pdftron/webviewer';
import axiosInstance from '../../api/axiosConfig';

export const Sign = () => {
  const [uploadedFiles, setUploadedFiles] = useState(null);
  // const [signing, setSigning] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const [step, setStep] = useState(1);
  const [instance, setInstance] = useState(null);
  // const [annotationManager, setAnnotationManager] = useState(null);

  const filePicker = useRef(null);

  // const handleSignFiles = async () => {
  //   setSigning(true);

  //   const formData = new FormData();
  //   uploadedFiles.forEach((file) => {
  //     formData.append('files', file.file);
  //   });

  //   const token = localStorage.getItem('token');

  //   const response = await axiosInstance.post(
  //     '/api/files/sign-multiple',
  //     formData,
  //     {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   if (response.data) {
  //     setUploadedFiles([]);
  //   }

  //   setSigning(false);
  // };

  const handleContinue = () => {
    setStep(2);
  };

  const viewer = useRef(null);

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
          'rubberStampToolGroupButton',
          'stampToolGroupButton',
          'fileAttachmentToolGroupButton',
          'calloutToolGroupButton',
          'undo',
          'redo',
          'eraserToolButton',
        ],
      },
      viewer.current
    ).then((instance) => {
      // const { iframeWindow } = instance.UI;
      const { documentViewer, annotationManager, Annotations } = instance.Core;
      const { VerificationOptions, openElements, loadDocument } = instance.UI;
      // select only the view group
      // instance.UI.setToolbarGroup('toolbarGroup-Insert');

      documentViewer.addEventListener(
        'documentLoaded',
        () => {
          openElements(['signatureListPanel']);
        },
        { once: true }
      );

      setInstance(instance);
      // setAnnotationManager(annotationManager);

      filePicker.current.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadedFiles(file);
          instance.UI.loadDocument(file);
        }
      };
    });
  }, []);

  const handleSignFiles = async () => {
    const { documentViewer, annotationManager } = instance.Core;

    annotationManager.exportAnnotations().then((xfdfString) => {
      documentViewer
        .getDocument()
        .getFileData({ xfdfString })
        .then(async (data) => {
          const arr = new Uint8Array(data);
          console.log('uploadedFiles', uploadedFiles, arr);

          const blob = new Blob([arr], {
            type: 'application/pdf',
          });
          // FormData is used to send blob data through fetch
          const formData = new FormData();
          formData.append('file', blob);

          // const response = await axiosInstance.post(
          //   '/api/files/sign',
          //   formData
          // );
          // if (response.data) {
          //   console.log('response.data', response.data);
          // }
        });
    });
  };
  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Select file to Sign</div>
      <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-[20px] overflow-hidden">
        <div className="w-full flex flex-col items-center justify-between h-full overflow-hidden">
          <div className="w-full h-full flex flex-col items-center gap-[12px] overflow-hidden">
            <div className="w-[300px]">
              <Steps
                items={
                  step === 1
                    ? [
                        {
                          title: 'Chọn file ký',
                          status: 'process',
                          icon: <ContainerFilled />,
                        },
                        {
                          title: 'Ký số',
                          status: 'wait',
                          icon: <SignatureFilled />,
                        },
                      ]
                    : [
                        {
                          title: 'Chọn file ký',
                          status: 'finish',
                          icon: <ContainerFilled />,
                        },
                        {
                          title: 'Ký số',
                          status: 'process',
                          icon: <SignatureFilled />,
                        },
                      ]
                }
              />
            </div>

            {step === 1 && (
              <label
                onClick={() => {
                  if (filePicker) {
                    filePicker.current.click();
                  }
                }}
                htmlFor="fileUpload"
                className={`border-2 w-full bg-purple-50 !m-0 border-dashed rounded-lg !mb-2 p-6 text-center block cursor-pointer ${'border-purple-500 bg-blue-50'}`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <CloudUploadOutlined
                    className="text-purple-500"
                    style={{ fontSize: '48px' }}
                  />
                  <p className="text-lg font-medium text-gray-600">
                    Kéo tệp cần ký vào khung hoặc click để chọn tệp (tối đa 10
                    file)
                  </p>
                  <p className="text-sm font-normal text-gray-400">
                    Định dạng được hỗ trợ [pdf, docx, xlsx, xml, pptx]
                  </p>
                  <p className="text-sm font-normal text-gray-400">
                    Kích thước hỗ trợ tối đa 20MB
                  </p>
                </div>
              </label>
            )}
            <div
              className="App"
              style={{ display: step > 1 ? 'flex' : 'none' }}
            >
              <div className="webviewer" ref={viewer}></div>
            </div>
          </div>
          <input type="file" ref={filePicker} style={{ display: 'none' }} />

          {step === 1 && (
            <Button
              disabled={uploadedFiles === null}
              onClick={handleContinue}
              className="!w-fit"
              type="primary"
            >
              Tiếp tục
            </Button>
          )}
          {step === 2 && (
            <Button
              // disabled={uploadedFiles === null}
              onClick={handleSignFiles}
              className="!w-fit"
              type="primary"
            >
              Gửi chữ ký
            </Button>
          )}

          {/* <Button onClick={handleSignFiles} className="!w-fit" type="primary">
              Ký số
            </Button> */}
        </div>
      </div>
    </div>
  );
};
