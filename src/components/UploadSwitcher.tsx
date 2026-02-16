import { useState } from "react";
import UploadButton from "./UploadButton";

export default function UploadSwitcher() {
  const [selectedOption, setSelectedOption] = useState<string>('');

  return (
    <>
      <div className="flex">
        <button className={`btn btn-primary ${selectedOption === 'pdf' ? 'active' : ''}`} onClick={() => setSelectedOption('pdf')} type="button">
          From PDF
        </button>
        <button onClick={() => setSelectedOption('pdf')} type="button">
          From Text
        </button>
      </div>
      <UploadButton></UploadButton>
    </>
  );
}
