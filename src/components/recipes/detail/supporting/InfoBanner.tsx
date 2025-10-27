import { Info } from "lucide-react";

/**
 * InfoBanner component displays information about viewing a modified recipe
 * Appears at the top of the Modified tab
 */
const InfoBanner = () => {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-blue-900">
          To jest zmodyfikowana wersja. Oryginalny przepis możesz zobaczyć w zakładce &ldquo;Oryginalny&rdquo;.
        </p>
      </div>
    </div>
  );
};

export default InfoBanner;
