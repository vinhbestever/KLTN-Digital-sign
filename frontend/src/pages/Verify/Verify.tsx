import { useEffect, useRef, useState } from 'react';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  FileAddOutlined,
  FileDoneOutlined,
  FolderOpenFilled,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Steps } from 'antd';
import { TableUser } from './TableUser';
import WebViewer from '@pdftron/webviewer';
import { useUser } from '../../context/UserContext';

export const Verify = () => {
  const [step, setStep] = useState(1);
  const filePicker = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState(null);

  const [userVerify, setUserVerify] = useState();
  const { user } = useUser();
  const viewer = useRef(null);
  const [instance, setInstance] = useState(null);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const renderStep = () => {
    switch (step) {
      case 1:
        return [
          {
            title: 'Chọn người dùng',
            status: 'process',
            icon: <UserOutlined />,
          },
          {
            title: 'Chọn tài liệu',
            status: 'wait',
            icon: <FileAddOutlined />,
          },
          {
            title: 'Kiểm tra',
            status: 'wait',
            icon: <FileDoneOutlined />,
          },
        ];
      case 2:
        return [
          {
            title: 'Chọn người dùng',
            status: 'done',
            icon: <UserOutlined />,
          },
          {
            title: 'Chọn tài liệu',
            status: 'process',
            icon: <FileAddOutlined />,
          },
          {
            title: 'Kiểm tra',
            status: 'wait',
            icon: <FileDoneOutlined />,
          },
        ];
      case 3:
        return [
          {
            title: 'Chọn người dùng',
            status: 'done',
            icon: <UserOutlined />,
          },
          {
            title: 'Chọn tài liệu',
            status: 'done',
            icon: <FileAddOutlined />,
          },
          {
            title: 'Kiểm tra',
            status: 'process',
            icon: <FileDoneOutlined />,
          },
        ];
      default:
        break;
    }
  };

  const handleContinue = async () => {
    setStep(2);
  };

  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        fullAPI: true,
      },
      viewer.current
    ).then(async (instance) => {
      setInstance(instance);

      filePicker.current.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadedFiles(file);
          instance.UI.loadDocument(file);
        }
      };
    });
  }, []);

  const handleVerify = async () => {
    const { PDFNet, documentViewer } = instance.Core;
    await PDFNet.initialize();

    const doc = await documentViewer.getDocument().getPDFDoc();

    // Run PDFNet methods with memory management
    await PDFNet.runWithCleanup(async () => {
      // lock the document before a read operation
      // runWithCleanup will auto unlock when complete
      doc.lockRead();

      const opts = await PDFNet.VerificationOptions.create(
        PDFNet.VerificationOptions.SecurityLevel.e_compatibility_and_archiving
      );

      // Add trust root to store of trusted certificates contained in VerificationOptions.
      await opts.addTrustedCertificateFromURL(
        `http://localhost:5173/api/auth/get-key/${user?.id}/public_key`
      );

      const result = await doc.verifySignedDigitalSignatures(opts);

      setStep(3);
      switch (result) {
        case PDFNet.PDFDoc.SignaturesVerificationStatus.e_unsigned:
          setMessage('Tài liệu không có trường chữ ký đã ký.');
          return false;

        case PDFNet.PDFDoc.SignaturesVerificationStatus.e_failure:
          setMessage('Lỗi nghiêm trọng khi xác minh ít nhất một chữ ký.');
          return false;
        case PDFNet.PDFDoc.SignaturesVerificationStatus.e_untrusted:
          setMessage('Không thể xác minh độ tin cậy của ít nhất một chữ ký.');
          return false;
        case PDFNet.PDFDoc.SignaturesVerificationStatus.e_unsupported:
          setMessage(
            'Có ít nhất một chữ ký chứa các tính năng không được hỗ trợ.'
          );
          return false;
        case PDFNet.PDFDoc.SignaturesVerificationStatus.e_verified:
          setMessage('Chữ ký hợp lệ!!!');
          setIsVerified(true);
          return true;
      }
    });
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Kiểm tra chữ ký</div>
      <div className="w-full h-full flex gap-[20px]">
        <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-[20px] overflow-hidden gap-[32px]">
          <div className="w-[600px]">
            <Steps items={renderStep()} />
          </div>
          {step === 1 && (
            <div className="w-full h-full flex flex-col items-center justify-between">
              <TableUser setUserVerify={setUserVerify} />
              <Button
                disabled={!userVerify}
                onClick={handleContinue}
                type="primary"
              >
                Tiếp tục
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="w-full h-full flex flex-col items-center justify-between">
              <label
                onClick={() => {
                  if (filePicker) {
                    filePicker.current.click();
                  }
                }}
                htmlFor="fileUpload"
                className={`border-2 w-full h-[250px] bg-purple-50 !m-0 border-dashed rounded-lg !mb-2 p-6 text-center block cursor-pointer ${'border-purple-500 bg-blue-50'}`}
              >
                <div className="flex flex-col items-center w-full h-full justify-center space-y-2">
                  <FolderOpenFilled
                    className="text-purple-950"
                    style={{ fontSize: '48px' }}
                  />
                  <p className="text-lg font-medium text-gray-600">
                    Kéo tệp cần kiểm tra vào khung này hoặc click để kiểm tra
                  </p>
                </div>
              </label>

              <Button
                onClick={handleVerify}
                disabled={uploadedFiles === null}
                type="primary"
              >
                Kiểm tra
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="w-full h-full flex flex-col items-center gap-[32px] p-32">
              {isVerified ? (
                <CheckCircleFilled
                  style={{ fontSize: '100px', color: 'green' }}
                />
              ) : (
                <CloseCircleFilled
                  style={{ fontSize: '100px', color: 'red' }}
                />
              )}

              <div className="flex flex-col gap-[12px] items-center justify-center">
                <div className="text-[24px]">{message}</div>

                <Button onClick={handleBack} size="large">
                  Quay lại
                </Button>
              </div>
            </div>
          )}

          <div className="App" style={{ display: 'none' }}>
            <div className="webviewer" ref={viewer}></div>
          </div>
          <input type="file" ref={filePicker} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};
