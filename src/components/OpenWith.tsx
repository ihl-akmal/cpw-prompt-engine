
import React from 'react';
import { SiOpenai, SiGooglegemini } from 'react-icons/si';

const OpenWith: React.FC = () => {
    const handleOpen = (url: string) => {
        window.open(url, '_blank');
    };

    const PerplexityIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeWidth="1.5" d="M1.5 1.5H8.5V8.5H1.5z"/>
            <path stroke="currentColor" strokeWidth="1.5" d="M5.5 5.5H12.5V12.5H5.5z"/>
        </svg>
    );

    const baseStyle = "w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white rounded-md shadow-lg transition-all hover:scale-105 hover:shadow-xl";

    return (
        <div className="flex flex-col gap-2 w-36">
            <button
                onClick={() => handleOpen('https://chat.openai.com')}
                className={`${baseStyle} bg-[#10A37F]`}
            >
                <SiOpenai size="12" />
                <span>Open ChatGPT</span>
            </button>
            <button
                onClick={() => handleOpen('https://claude.ai')}
                className={`${baseStyle} bg-[#D97757]`}
            >
                <span style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: '12px', lineHeight: '1' }}>A</span>
                <span>Open Claude</span>
            </button>
            <button
                onClick={() => handleOpen('https://gemini.google.com')}
                className={`${baseStyle} bg-[#4285F4]`}
            >
                <SiGooglegemini size="12" />
                <span>Open Gemini</span>
            </button>
            {/* <button
                onClick={() => handleOpen('https://www.perplexity.ai')}
                className={`${baseStyle} bg-gray-800`}
            >
                <PerplexityIcon />
                <span>Open Perplexity</span>
            </button> */}
        </div>
    );
};

export default OpenWith;
