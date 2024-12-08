import React from 'react';
import SignFileForm from '../components/SignFileForm';
import VerifyFileForm from '../components/VerifyFileForm';
import UploadFileForm from '../components/UploadFileForm';
import PreviewAndSign from '../components/PreviewAndSign';

const HomePage: React.FC = () => {
  return (
    <div className="homepage">
      <h1>Digital Signature System</h1>
      <div className="forms-container">
        {/* <SignFileForm />*/}
        <VerifyFileForm />
        <PreviewAndSign />
      </div>
    </div>
  );
};

export default HomePage;
