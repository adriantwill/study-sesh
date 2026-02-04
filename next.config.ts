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
				hostname: "ystrfizsczfvkcbwetpb.supabase.co",
				port: "",
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
};

export default nextConfig;
