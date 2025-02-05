import {
  CloudUploadOutlined,
  ContainerFilled,
  SignatureFilled,
} from '@ant-design/icons';
import { Button, message, Steps } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import WebViewer from '@pdftron/webviewer';
import axiosInstance from '../../api/axiosConfig';

export const Sign = () => {
  const [uploadedFiles, setUploadedFiles] = useState(null);

  const [step, setStep] = useState(1);
  const [instance, setInstance] = useState(null);
  const [isSigned, setIsSigned] = useState(false);

  const filePicker = useRef(null);

  const handleContinue = () => {
    setStep(2);
  };
  const handleBack = () => {
    setIsSigned(false);
    setStep(1);
  };
  const viewer = useRef(null);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        fullAPI: true,
      },
      viewer.current
    ).then(async (instance) => {
      // const { iframeWindow } = instance.UI;
      const { documentViewer, annotationManager } = instance.Core;
      const { openElements } = instance.UI;

      instance.UI.setToolbarGroup('toolbarGroup-Insert');
      documentViewer.addEventListener(
        'documentLoaded',
        () => {
          openElements(['signatureListPanel']);
        },
        { once: true }
      );

      setInstance(instance);

      filePicker.current.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadedFiles(file);
          instance.UI.loadDocument(file);
        }
      };

      annotationManager.addEventListener(
        'annotationChanged',
        (annotations, action, { imported }) => {
          console.log('action', action);

          if (action === 'add') {
            setIsSigned(true);
          }
        }
      );
    });
  }, []);

  const handleSignFiles = async () => {
    if (!isSigned) {
      message.error('Bạn chưa thực hiện ký file!');
      return;
    }

    const { PDFNet, documentViewer, annotationManager } = instance.Core;
    await PDFNet.initialize();

    const doc = await documentViewer.getDocument().getPDFDoc();

    const hasSigned = await doc.hasSignatures();

    if (hasSigned) {
      message.info('File của bạn đã được ký!');
      return;
    }

    const xfdf = await annotationManager.exportAnnotations();
    const fdfDoc = await PDFNet.FDFDoc.createFromXFDF(xfdf);
    await doc.fdfMerge(fdfDoc);
    await doc.flattenAnnotations();
    console.log('xfdf', fdfDoc);

    // Run PDFNet methods with memory management

    await PDFNet.runWithCleanup(async () => {
      // runWithCleanup will auto unlock when complete

      doc.lock();

      // Add an StdSignatureHandler instance to PDFDoc, making sure to keep track of it using the ID returned.

      const sigHandlerId = await doc.addStdSignatureHandlerFromURL(
        'certificate.pfx',
        'key-password'
      );

      const approvalSigField = await doc.createDigitalSignatureField(
        'newfield'
      );

      const approvalSignatureWidget =
        await PDFNet.SignatureWidget.createWithDigitalSignatureField(
          doc,
          await PDFNet.Rect.init(500, 20, 600, 100),
          approvalSigField
        );

      // await approvalSigField.setLocation('Viet Nam');
      // await approvalSigField.setReason('Document certification.');
      // await approvalSigField.setContactInfo('Thang Long University');
      // // (OPTIONAL) Add an appearance to the signature field.

      const img = await PDFNet.Image.createFromURL(
        doc,
        'https://upload.wikimedia.org/wikipedia/vi/a/ad/LogoTLU.jpg'
      );

      await approvalSignatureWidget.createSignatureAppearance(img);

      //We will need to get the first page so that we can add an approval signature field to it

      const page1 = await doc.getPage(1);

      page1.annotPushBack(approvalSignatureWidget);

      // Prepare the signature and signature handler for signing.

      await approvalSigField.signOnNextSaveWithCustomHandler(sigHandlerId);

      // The actual approval signing will be done during the save operation.

      const buf = await doc.saveMemoryBuffer(0);

      const blob = new Blob([buf], { type: 'application/pdf' });

      //Save via any mechanism that you like - saveBlob creates a link, then clicks the link

      // saveBlob(blob, 'signed_doc.pdf');

      console.log('success');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certified.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // instance.UI.loadDocument(blob, { filename: 'signed_doc.pdf' });
    });
  };

  const fetchPfxFile = async () => {
    try {
      const response = await axiosInstance.get('/api/files/generate-temp-pfx');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy file PFX:', error);
      return null;
    }
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
            <div className="flex items-center justify-center gap-[12px]">
              <Button onClick={handleBack} className="!w-fit">
                Quay lại
              </Button>
              <Button
                disabled={!isSigned}
                onClick={handleSignFiles}
                className="!w-fit"
                type="primary"
              >
                Gửi chữ ký
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
