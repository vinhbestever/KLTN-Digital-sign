import {
  CloudUploadOutlined,
  ContainerFilled,
  SignatureFilled,
} from '@ant-design/icons';
import { Button, Steps } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import WebViewer from '@pdftron/webviewer';

interface UploadedFile {
  id: number;
  name: string;
  file: File;
}

export const Sign = () => {
  const [uploadedFiles, setUploadedFiles] = useState(null);
  // const [signing, setSigning] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const [step, setStep] = useState(1);
  const [instance, setInstance] = useState(null);
  const [annotationManager, setAnnotationManager] = useState(null);

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
      setAnnotationManager(annotationManager);

      filePicker.current.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadedFiles(file);
          instance.UI.loadDocument(file);
        }
      };
      instance.Core.annotationManager.addEventListener(
        'annotationChanged',
        (annotations, action, { imported }) => {
          console.log('annotations', annotations, action, imported);
        }
      );
    });
  }, []);

  const addField = (type, point = {}, name = '', value = '', flag = {}) => {
    const { documentViewer, Annotations } = instance.Core;
    const annotationManager = documentViewer.getAnnotationManager();
    const doc = documentViewer.getDocument();
    const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx =
      page.first !== null ? page.first : documentViewer.getCurrentPage();
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = documentViewer.getZoomLevel();

    const textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = page_idx;
    const rotation = documentViewer.getCompleteRotation(page_idx) * 90;
    textAnnot.Rotation = rotation;
    if (rotation === 270 || rotation === 90) {
      textAnnot.Width = 50.0 / zoom;
      textAnnot.Height = 250.0 / zoom;
    } else {
      textAnnot.Width = 250.0 / zoom;
      textAnnot.Height = 50.0 / zoom;
    }
    textAnnot.X = (page_point.x || page_info.width / 2) - textAnnot.Width / 2;
    textAnnot.Y = (page_point.y || page_info.height / 2) - textAnnot.Height / 2;

    textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
    textAnnot.custom = {
      type,
      value,
      flag,
      name: `qqqqqq`,
    };

    // set the type of annot
    textAnnot.setContents(textAnnot.custom.name);
    textAnnot.FontSize = '' + 20.0 / zoom + 'px';
    textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
    textAnnot.TextColor = new Annotations.Color(0, 165, 228);
    textAnnot.StrokeThickness = 1;
    textAnnot.StrokeColor = new Annotations.Color(0, 165, 228);
    textAnnot.TextAlign = 'center';

    textAnnot.Author = annotationManager.getCurrentUser();

    annotationManager.deselectAllAnnotations();
    annotationManager.addAnnotation(textAnnot, true);
    annotationManager.redrawAnnotation(textAnnot);
    annotationManager.selectAnnotation(textAnnot);

    // const createSignHereElement =
    //   Annotations.SignatureWidgetAnnotation.prototype.createSignHereElement;

    // Annotations.SignatureWidgetAnnotation.prototype.createSignHereElement =
    //   function () {
    //     // signHereElement is the default one with dark blue background
    //     const signHereElement = createSignHereElement.apply(this, arguments);

    //     signHereElement.style.background = 'red';
    //     signHereElement.X =
    //       (page_point.x || page_info.width / 2) - textAnnot.Width / 2;
    //     signHereElement.Y =
    //       (page_point.y || page_info.height / 2) - textAnnot.Height / 2;
    //     return signHereElement;
    //   };
  };

  const completeSigning = async () => {
    const xfdf = await annotationManager.exportAnnotations({
      widgets: false,
      links: false,
    });

    console.log('xfdf', xfdf);

    // await updateDocumentToSign(docId, email, xfdf);
    // navigate('/');
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
            <div
              draggable
              // onDragStart={(e) => dragStart(e)}
              // onDragEnd={(e) => dragEnd(e, 'TEXT')}
            >
              <Button
                disabled={uploadedFiles === null}
                onClick={() => completeSigning()}
                className="!w-fit"
                type="primary"
              >
                Thêm chữ ký
              </Button>
            </div>
          )}

          {/* <Button onClick={handleSignFiles} className="!w-fit" type="primary">
              Ký số
            </Button> */}
        </div>
      </div>
    </div>
  );
};
