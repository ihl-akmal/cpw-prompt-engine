import React from 'react';

const About: React.FC = () => {
    return (
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-4">Turn Lazy Prompts into Smart Prompts</h1>
                    <p className="mb-4">
                        Prompthink sebuah alat bantu canggih yang dirancang untuk membantu pengguna dalam merumuskan dan mengoptimalkan "prompt" untuk berinteraksi dengan model kecerdasan buatan (AI). Dalam dunia AI, prompt adalah instruksi atau pertanyaan yang Anda berikan kepada AI untuk mendapatkan respons yang diinginkan. Kualitas prompt sangat menentukan kualitas output yang dihasilkan oleh AI.
                    </p>

                    <p>
                    Bagi pemula, ini adalah cara cepat untuk belajar berpikir seperti prompt engineer. Bagi profesional seperti marketer, tool ini bisa menjadi secret weapon untuk menghasilkan prompt siap pakai yang spesifik untuk kebutuhan ide konten, strategi pemasaran, atau tugas lainnya.
                    </p>
                    {/* <h2 className="text-2xl font-bold mb-2">Bagaimana Prompt Engine Membantu Anda?</h2>
                    <p className="mb-4">
                        Prompt engineering adalah seni dan ilmu merancang input (prompt) untuk mendapatkan output terbaik dari model AI. Tools seperti Prompt Engine ini sangat membantu dari berbagai sisi:
                    </p>
                    <ul className="list-disc pl-5 mb-4">
                        <li><strong>Efisiensi:</strong> Mempercepat proses pembuatan prompt yang efektif, sehingga Anda tidak perlu lagi menebak-nebak atau melakukan banyak percobaan.</li>
                        <li><strong>Kualitas:</strong> Menghasilkan prompt yang lebih terstruktur dan kaya konteks, sehingga AI dapat memahami permintaan Anda dengan lebih baik dan memberikan hasil yang lebih akurat dan relevan.</li>
                        <li><strong>Kreativitas:</strong> Membuka berbagai kemungkinan baru dalam berinteraksi dengan AI, membantu Anda menemukan cara-cara inovatif untuk memanfaatkan teknologi ini.</li>
                        <li><strong>Aksesibilitas:</strong> Menjadikan teknologi AI lebih mudah diakses oleh semua orang, bahkan bagi mereka yang tidak memiliki latar belakang teknis yang mendalam.</li>
                    </ul> */}
                </div>
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-1.5 bg-zinc-900 rounded-lg leading-none">
                        <img src="https://plus.unsplash.com/premium_photo-1683120966127-14162cdd0935?q=80&w=663&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="AI and Prompt Engineering" className="rounded-md w-full h-[450px] object-cover" />
                    </div>
                </div>
            </div>

            {/* <div className="mt-8">
                <h2 className="text-2xl font-bold mb-2">Masa Depan AI dan Prompt Engineering</h2>
                <p className="mb-4">
                    Masa depan AI sangat cerah, dan kemampuannya untuk mengubah berbagai aspek kehidupan kita tidak terbatas. Seiring dengan perkembangan model AI yang semakin canggih, peran prompt engineering akan menjadi semakin krusial. Kemampuan untuk berkomunikasi secara efektif dengan AI akan menjadi sebuah keahlian yang sangat berharga.
                </p>
                <p>
                    Tools seperti Prompt Engine akan menjadi jembatan antara manusia dan mesin, memungkinkan kita untuk berkolaborasi dengan AI secara lebih harmonis dan produktif. Dengan bantuan prompt engineering, kita dapat memastikan bahwa teknologi AI digunakan secara maksimal untuk kebaikan umat manusia.
                </p>
            </div> */}
        </div>
    );
};

export default About;
