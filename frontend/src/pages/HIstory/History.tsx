import { Button, DatePicker, Input, Modal, Table, message } from 'antd';
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { CloudDownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useUser } from '../../context/UserContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
const { Search } = Input;
const { RangePicker } = DatePicker;

export const History = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportRange, setExportRange] = useState([]);

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchSignedFiles();
    }
  }, [user, searchTerm, dateRange, page, pageSize]);

  const fetchSignedFiles = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `api/files/signed-files${user?.role === 'admin' ? '-all' : ''}`,
        {
          params: {
            search: searchTerm,
            startDate:
              dateRange.length > 0 ? dateRange[0].format('YYYY-MM-DD') : null,
            endDate:
              dateRange.length > 0 ? dateRange[1].format('YYYY-MM-DD') : null,
            page,
            pageSize,
          },
        }
      );
      setFiles(response.data.files);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách file đã ký:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await axiosInstance.get(
        `api/files/download-signed/${fileId}`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      message.success('Tải file thành công!');
    } catch (error) {
      console.error('Lỗi khi tải file đã ký:', error);
      message.error('Lỗi khi tải file!');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axiosInstance.get(
        `api/files/signed-files-export${user?.role === 'admin' ? '-all' : ''}`,
        {
          params: {
            startDate: exportRange[0].format('YYYY-MM-DD'),
            endDate: exportRange[1].format('YYYY-MM-DD'),
          },
        }
      );

      const exportData = response.data.files.map((file, index) => ({
        STT: index + 1,
        'Tên tệp': file.file_name,
        'Trạng thái': file.status || 'Hợp lệ',
        'Ngày giao dịch': dayjs(file.signed_at).format('DD/MM/YYYY HH:mm'),
      }));

      // Tạo worksheet
      const ws = XLSX.utils.json_to_sheet([]);

      // Thêm tiêu đề ngày xuất
      XLSX.utils.sheet_add_aoa(
        ws,
        [[`Ngày xuất: ${dayjs().format('DD/MM/YYYY')}`]],
        { origin: 'A1' }
      );

      // Thêm tiêu đề thống kê
      XLSX.utils.sheet_add_aoa(ws, [['THỐNG KÊ LỊCH SỬ GIAO DỊCH KÝ SỐ']], {
        origin: 'A3',
      });

      // Thêm khoảng thời gian
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          [
            `Từ ngày: ${exportRange[0].format('DD/MM/YYYY')}`,
            `Đến ngày: ${exportRange[1].format('DD/MM/YYYY')}`,
          ],
        ],
        { origin: 'A4' }
      );

      // Thêm dữ liệu bảng
      XLSX.utils.sheet_add_aoa(
        ws,
        [['STT', 'Tên tệp', 'Trạng thái', 'Ngày giao dịch']],
        { origin: 'A6' }
      );

      XLSX.utils.sheet_add_json(ws, exportData, {
        origin: 'A7',
        skipHeader: true,
      });

      // Cấu hình định dạng cột
      ws['!cols'] = [
        { wch: 5 }, // STT
        { wch: 40 }, // Tên tệp
        { wch: 15 }, // Kích thước
        { wch: 15 }, // Loại giao dịch
        { wch: 15 }, // Trạng thái
        { wch: 15 }, // Ngày giao dịch
      ];

      // Tạo workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử ký số');

      // Xuất file Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileBlob = new Blob([excelBuffer], {
        type: 'application/octet-stream',
      });
      saveAs(fileBlob, `Lich_Su_Ky_${new Date().toISOString()}.xlsx`);

      message.success('Xuất báo cáo thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất file Excel:', error);
      message.error('Lỗi khi xuất báo cáo!');
    }
  };

  const openExportModal = () => {
    setIsModalOpen(true);
  };

  const confirmExport = async () => {
    setIsModalOpen(false);
    if (exportRange.length < 2) {
      message.error('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc!');
      return;
    }
    handleExportExcel();
  };
  const columns = [
    {
      title: 'Số Thứ Tự',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'Tên File',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: 'ID người dùng đã ký',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tên người đã ký',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Ngày Đã Ký',
      dataIndex: 'signed_at',
      key: 'signed_at',
      render: (signed_at) => dayjs(signed_at).format('HH:mm DD/MM/YYYY'),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (record) => (
        <div className="ml-9">
          <Button
            onClick={() => handleDownload(record.id, record.file_name)}
            icon={<CloudDownloadOutlined />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Lịch sử ký</div>
      <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-[20px] overflow-auto gap-[18px]">
        <div className="w-full flex items-center justify-between">
          <div className="text-[16px]">Danh sách file đã ký</div>

          <div className="flex items-center justify-end gap-[10px]">
            <Button onClick={openExportModal} type="primary">
              Xuất báo cáo
            </Button>

            <Button
              onClick={() => {
                window.location.href = '/sign';
              }}
            >
              Ký mới
            </Button>
          </div>
        </div>

        <div className="flex w-full items-center gap-[12px]">
          <Search
            placeholder="Tìm kiếm tên file"
            allowClear
            onSearch={(value) => setSearchTerm(value)}
            style={{ width: 350 }}
          />
          <RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={(dates) => setDateRange(dates || [])}
          />
        </div>

        <Table
          columns={columns}
          dataSource={files}
          loading={loading}
          rowKey="id"
          style={{ width: '100%' }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ y: 55 * 8 }}
        />
      </div>

      <Modal
        title="Chọn khoảng ngày"
        open={isModalOpen}
        onOk={confirmExport}
        onCancel={() => setIsModalOpen(false)}
        footer={
          <div className="flex items-center w-full justify-end gap-[12px]">
            <Button onClick={() => setIsModalOpen(false)}>Thoát</Button>
            <Button type="primary" onClick={() => confirmExport()}>
              Xuất
            </Button>
          </div>
        }
      >
        <RangePicker onChange={(dates) => setExportRange(dates || [])} />
      </Modal>
    </div>
  );
};
