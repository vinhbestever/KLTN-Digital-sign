import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  ContainerFilled,
  SignatureFilled,
} from '@ant-design/icons';
import { Button, message, Steps } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import WebViewer from '@pdftron/webviewer';
import axiosInstance from '../../api/axiosConfig';
import { useUser } from '../../context/UserContext';

export const Sign = () => {
  const [uploadedFiles, setUploadedFiles] = useState(null);

  const [step, setStep] = useState(1);
  const [instance, setInstance] = useState(null);
  const [isSigned, setIsSigned] = useState(false);
  const [blobFile, setBlobFile] = useState();

  const filePicker = useRef(null);
  const { user } = useUser();

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
        licenseKey:
          'demo:1738134661579:7e96ae3803000000002af4ccc4d7039aebd9699379b2679c5a49147ffc',
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
        `http://localhost:5173/api/auth/get-key/${user?.id}/private_key`,
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

      console.log('uploadedFiles', uploadedFiles.name);

      setBlobFile(blob);
      await saveSignedFile(blob, uploadedFiles.name);
    });
  };

  const saveSignedFile = async (blob: Blob, filename: string) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, filename);

      console.log('formData', filename, formData, blob);

      const response = await axiosInstance.post(
        '/api/files/save-signed-file',
        formData
      );
      if (response) {
        setStep(3);
      }
    } catch (error) {
      console.error('Lỗi khi lưu file đã ký:', error);
    }
  };

  const handleDownloadFile = () => {
    if (!blobFile) return;
    const url = window.URL.createObjectURL(blobFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFiles.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Chọn tài liệu ký</div>
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
                    className="text-purple-950"
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

            {step === 3 && (
              <div className="flex flex-col items-center justify-center w-full gap-[22px] pt-[42px]">
                <div className="flex flex-col items-center justify-center gap-[12px]">
                  <CheckCircleOutlined
                    style={{ fontSize: '50px', color: '#573b8a' }}
                  />
                  <div className="text-[18px] text-[#573b8a] font-medium">
                    KÝ SỐ HOÀN TẤT!
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[14px] text-gray-600">
                      Dữ liệu đã được ký số trên dịch vụ Hệ thống
                    </div>

                    <div className="text-[14px] text-gray-600">
                      Tra cứu lịch sử tại{' '}
                      <a className="text-blue-600" href="/history">
                        Đây
                      </a>
                    </div>
                  </div>
                </div>

                <div className="w-[300px] flex flex-col gap-[12px] justify-center items-center">
                  <Button
                    onClick={handleDownloadFile}
                    className="w-full"
                    type="primary"
                  >
                    Tải về tệp đã ký
                  </Button>
                  <Button onClick={handleBack} className="w-full">
                    Ký file mới
                  </Button>
                </div>
              </div>
            )}
            <div
              className="App"
              style={{ display: step === 2 ? 'flex' : 'none' }}
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
        </div>
      </div>
    </div>
  );
};
