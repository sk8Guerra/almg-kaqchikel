import { AreaTabs } from "./area-tabs";

type EnrollmentLayoutProps = {
  children: React.ReactNode;
};

export default function EnrollmentLayout({ children }: EnrollmentLayoutProps) {
  return (
    <>
      <AreaTabs />
      {children}
    </>
  );
}
