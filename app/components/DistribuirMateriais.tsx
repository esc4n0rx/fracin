import { supabase } from "../supabaseClient";
import axios from "axios";
import * as XLSX from "xlsx";

interface AnaliseItem {
  Cod: string; 
  Loja: string;
  "Cód. Produto": string;
  Perda: number;
  "Receita Bruta": number;
}

interface DistribuicaoItem {
  CodLoja: string; 
  Material: string;
  Descricao: string;
  QuantidadeTotal: number;
}

export default async function distribuirMateriais() {
  try {
    const today = new Date().toISOString().split("T")[0]; 
    console.log("Buscando materiais para a data:", today);
    const { data: materiais, error: errorMateriais } = await supabase
      .from("materiais")
      .select("*")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (errorMateriais) {
      console.error("Erro ao buscar materiais:", errorMateriais);
      throw errorMateriais;
    }

    if (!materiais || materiais.length === 0) {
      console.error("Nenhum material encontrado para o dia atual.");
      return;
    }

    console.log("Materiais encontrados:", materiais);

    console.log("Carregando dados de análise via API...");
    let analise: AnaliseItem[] = [];

    try {
      const response = await axios.get("/api/carregarAnalise");
      analise = response.data.data;
      console.log("Dados da planilha carregados via API:", analise);
    } catch (error) {
      console.error("Erro ao carregar os dados da API:", error);
      return;
    }

    if (!analise || analise.length === 0) {
      console.error("Nenhum dado de análise encontrado.");
      return;
    }

    const analiseIndexada = analise.reduce((acc, item) => {
      if (!acc[item["Cód. Produto"]]) acc[item["Cód. Produto"]] = [];
      acc[item["Cód. Produto"]].push(item);
      return acc;
    }, {} as { [codigoProduto: string]: AnaliseItem[] });

    console.log("Análise indexada por produto:", analiseIndexada);

    const lojaContador: { [cod: string]: number } = {};

    const distribuicao: DistribuicaoItem[] = [];

    for (const material of materiais) {
      console.log(`Processando material: ${material.codigo} - ${material.descricao}`);
      const codProduto = material.codigo;

      const lojasCandidatas = analiseIndexada[codProduto] || [];
      console.log(`Lojas candidatas para o produto ${codProduto}:`, lojasCandidatas);

      const lojasOrdenadas = lojasCandidatas.sort((a: AnaliseItem, b: AnaliseItem) => {
        return a.Perda - b.Perda || b["Receita Bruta"] - a["Receita Bruta"];
      });

      console.log(`Lojas ordenadas para o produto ${codProduto}:`, lojasOrdenadas);

      let lojaSelecionada = null;

      for (const loja of lojasOrdenadas) {
        if (lojaContador[loja.Cod] && lojaContador[loja.Cod] >= 3) continue;

        lojaSelecionada = loja.Cod; 
        lojaContador[loja.Cod] = (lojaContador[loja.Cod] || 0) + 1;
        break;
      }

      if (!lojaSelecionada) lojaSelecionada = "LOJA_PADRAO";

      distribuicao.push({
        CodLoja: lojaSelecionada,
        Material: material.codigo,
        Descricao: material.descricao,
        QuantidadeTotal: material.quantidade,
      });
    }

    console.log("Distribuição final:", distribuicao);

    const { error: errorInsert } = await supabase.from("gera_distribuicao").insert(distribuicao);

    if (errorInsert) {
      console.error("Erro ao inserir distribuição no banco:", errorInsert);
      throw errorInsert;
    }

    const worksheet = XLSX.utils.json_to_sheet(distribuicao);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Distribuicao");

    const excelData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    return blob; 
  } catch (error) {
    console.error("Erro ao calcular a distribuição:", error);
    throw error;
  }
}
