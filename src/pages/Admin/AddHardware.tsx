import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import AssetForm from '../../components/Admin/AssetForm';

const AddHardware: React.FC = () => {
  return (
    <AdminLayout title="ADD_HARDWARE_KIT">
      <AssetForm category="hardware" title="REGISTER_NEW_HARDWARE_MODULE" />
    </AdminLayout>
  );
};

export default AddHardware;
