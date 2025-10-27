import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js";
import type { NutritionPieChartProps } from "@/components/recipes/types";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * NutritionPieChart component displays macronutrient distribution
 * Uses Chart.js with proper color scheme (green/yellow/orange)
 */
const NutritionPieChart = ({ protein, fat, carbs }: NutritionPieChartProps) => {
  /**
   * Prepare chart data with proper colors and labels
   */
  const chartData = useMemo(() => {
    const total = protein + fat + carbs;

    // Don't show chart if no macros
    if (total === 0) {
      return null;
    }

    return {
      labels: ["Białko", "Tłuszcze", "Węglowodany"],
      datasets: [
        {
          data: [protein, fat, carbs],
          backgroundColor: [
            "#16a34a", // green-600 for protein
            "#fb923c", // orange-400 for fat
            "#facc15", // yellow-400 for carbs
          ],
          borderColor: [
            "#15803d", // green-700 border
            "#f97316", // orange-500 border
            "#eab308", // yellow-500 border
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [protein, fat, carbs]);

  /**
   * Chart.js options configuration
   */
  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          font: {
            size: 13,
            family: "system-ui, -apple-system, sans-serif",
          },
          color: "#374151", // gray-700
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#1f2937", // gray-800
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = protein + fat + carbs;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value}g (${percentage}%)`;
          },
        },
      },
    },
  };

  // Don't render if no data
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <p>Brak danych do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto py-4">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default NutritionPieChart;
