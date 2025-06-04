import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CustomButton } from './styles';

interface IRes {
    nome: string;
    pontuacao: number;
    status: string;
}

const Resultado = ({ nome, pontuacao, status }: IRes) => {
    const ref = useRef<HTMLDivElement>(null);

    const gerarPdf = async () => {
        if (!ref.current) return;

        const canvas = await html2canvas(ref.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('resultado.pdf');
    };

    return (
        <div>
            <div ref={ref} style={{ padding: 20, background: '#fff' }}>
                <h1>Resultado do Teste</h1>
                <p>Nome: {nome}</p>
                <p>Acertos: {pontuacao}</p>
                <p>Status: {status}</p>
            </div>

            <CustomButton  onClick={gerarPdf}>Baixar PDF</CustomButton>
        </div>
    );
};

export default Resultado;
