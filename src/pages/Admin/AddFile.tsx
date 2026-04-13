import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import AssetForm from '../../components/Admin/AssetForm';

const AddFile: React.FC = () => {
  return (
    <AdminLayout title="ADD_PROJECT_FILE">
      <AssetForm category="file" title="UPLOAD_NEW_PROJECT_ASSET" />
    </AdminLayout>
  );
};

export default AddFile;
