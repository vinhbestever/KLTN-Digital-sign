import {
  CloudUploadOutlined,
  DeleteFilled,
  EditFilled,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useState } from 'react';

export const Upload = ({
  uploadedFiles,
  setUploadedFiles,
  filePicker,
}: any) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileCounter, setFileCounter] = useState(0);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    handleFilesUpload(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFilesUpload(files);
  };

  const handleFilesUpload = (files: File[]) => {
    const newFiles = files.map((file) => ({
      id: fileCounter + 1,
      name: file.name,
      file,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setUploadedFiles((prev: any) => [...prev, ...newFiles]);
    setFileCounter((prev) => prev + files.length);
  };

  const handleDeleteFile = (id: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setUploadedFiles((prev: any[]) =>
      prev.filter((file: { id: number }) => file.id !== id)
    );
  };

  const handleEditFile = (id: number) => {
    const newName = prompt('Enter new file name:');
    if (newName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUploadedFiles((prev: any[]) =>
        prev.map((file: { id: number }) =>
          file.id === id ? { ...file, name: newName } : file
        )
      );
    }
  };

  return (
    <div className="mb-3 w-full">
      {/* Upload Section */}
      <label
        htmlFor="fileUpload"
        className={`border-2 w-full bg-purple-50 !m-0 border-dashed rounded-lg !mb-2 p-6 text-center block cursor-pointer ${
          dragActive ? 'border-purple-500 bg-blue-50' : 'border-purple-300'
        }`}
        // @ts-expect-error: Unreachable code error
        onDragEnter={handleDrag}
        // @ts-expect-error: Unreachable code error
        onDragOver={handleDrag}
        // @ts-expect-error: Unreachable code error
        onDragLeave={handleDrag}
        // @ts-expect-error: Unreachable code error
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <CloudUploadOutlined
            className="text-purple-500"
            style={{ fontSize: '48px' }}
          />
          <p className="text-lg font-medium text-gray-600">
            Kéo tệp cần ký vào khung hoặc click để chọn tệp (tối đa 10 file)
          </p>
          <p className="text-sm font-normal text-gray-400">
            Định dạng được hỗ trợ [pdf, docx, xlsx, xml, pptx]
          </p>
          <p className="text-sm font-normal text-gray-400">
            Kích thước hỗ trợ tối đa 20MB
          </p>
        </div>
        <input
          id="fileUpload"
          type="file"
          multiple
          ref={filePicker}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Uploaded Files List */}
      <div className="flex flex-col gap-[8px] h-[400px] overflow-auto">
        {uploadedFiles.map(
          (file: {
            id: React.Key | null | undefined;
            name:
              | string
              | number
              | boolean
              | React.ReactElement<
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  any,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  string | React.JSXElementConstructor<any>
                >
              | Iterable<React.ReactNode>
              | React.ReactPortal
              | null
              | undefined;
            file: { size: number };
          }) => (
            <div
              key={file.id}
              className="flex cursor-pointer justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div>
                <p className="text-gray-800 font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="flex space-x-2 gap-[8px]">
                {/* Edit Button */}

                <Tooltip title="Edit">
                  <Button
                    // @ts-expect-error: Unreachable code error
                    onClick={() => handleEditFile(file.id)}
                    type="default"
                    shape="circle"
                    icon={<EditFilled />}
                  />
                </Tooltip>
                {/* Delete Button */}

                <Tooltip title="Delete">
                  <Button
                    // @ts-expect-error: Unreachable code error
                    onClick={() => handleDeleteFile(file.id)}
                    type="primary"
                    shape="circle"
                    icon={<DeleteFilled />}
                  />
                </Tooltip>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
