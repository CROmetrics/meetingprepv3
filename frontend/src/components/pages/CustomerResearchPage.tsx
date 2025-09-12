import { Layout } from '../layout/Layout';
import { CustomerResearch } from './CustomerResearch';

export function CustomerResearchPage() {
  return (
    <Layout>
      {/* Hero Section for Research Page */}
      <div className="bg-gradient-to-br from-cro-green-100 via-white to-cro-blue-100 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-cro-green-100 text-cro-green-700 rounded-xl text-sm font-medium mb-4">
              AI-Powered Prospect Intelligence
            </span>
            <h1 className="text-4xl font-bold text-cro-soft-black-700 mb-4">
              Customer Research Portal
            </h1>
            <p className="text-lg text-cro-purple-700 leading-relaxed">
              Search companies in HubSpot, customize research prompts, and generate 
              AI-powered intelligence reports to understand your prospects better.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <CustomerResearch />
      </div>
    </Layout>
  );
}