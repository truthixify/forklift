import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, MonoLabel } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404: route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <AppShell>
      <section className="max-w-[860px] mx-auto px-6 py-32">
        <ManifestCard shadow="hivis" idTab={<IdTab variant="ink">ERROR · 404</IdTab>} formFooter="ROUTE NOT FOUND" pageNumber="—">
          <StatusBand state="disputed" pulse={false}>NO MANIFEST FOUND AT THIS PATH</StatusBand>
          <div className="p-12 text-center">
            <h1 className="display-hero text-[96px] font-medium leading-none">404</h1>
            <MonoLabel className="block mt-4">{location.pathname}</MonoLabel>
            <p className="mt-6 text-[18px]">This route doesn't exist on the marketplace.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/"><FlButton variant="cobalt">Back to home</FlButton></Link>
              <Link to="/bounties"><FlButton variant="secondary">Browse bounties</FlButton></Link>
            </div>
          </div>
        </ManifestCard>
      </section>
    </AppShell>
  );
};

export default NotFound;
