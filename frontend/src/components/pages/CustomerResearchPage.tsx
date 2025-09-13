import { Layout } from '../layout/Layout';
import { CustomerResearch } from './CustomerResearch';

export function CustomerResearchPage() {
  return (
    <Layout>
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <CustomerResearch />
      </div>
    </Layout>
  );
}
