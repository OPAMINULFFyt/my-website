import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import AssetForm from '../../components/Admin/AssetForm';

const AddCourse: React.FC = () => {
  return (
    <AdminLayout title="ADD_NEW_COURSE">
      <AssetForm category="course" title="DEPLOY_NEW_COURSE_MODULE" />
    </AdminLayout>
  );
};

export default AddCourse;
