import React, { useState } from 'react';
import { Upload, Image, message } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

export default function ImageUpload({ value, onChange, disabled }) {
  const [preview, setPreview] = useState(null);

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB');
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    onChange?.(file);
    return false;
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
  };

  if (preview || value) {
    return (
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <Image
          src={preview}
          alt="预览"
          style={{ maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
        />
        {!disabled && (
          <div
            onClick={handleRemove}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DeleteOutlined />
          </div>
        )}
      </div>
    );
  }

  return (
    <Dragger
      accept="image/*"
      showUploadList={false}
      beforeUpload={beforeUpload}
      disabled={disabled}
      style={{ borderRadius: 8 }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
      <p className="ant-upload-hint">支持 JPG、PNG、BMP 等常见图片格式，最大 10MB</p>
    </Dragger>
  );
}
