import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "30mb",
		},
	},
	serverExternalPackages: ["node-poppler"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "studyimages.adrianwill.com",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
