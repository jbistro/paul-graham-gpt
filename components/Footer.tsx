import { IconBrandGithub, IconBrandTwitter } from "@tabler/icons-react";
import { FC } from "react";

export const Footer: FC = () => {
  return (
    <div className="flex h-[50px] border-t border-gray-300 py-2 px-8 items-center sm:justify-between justify-center">
      <div className="hidden sm:flex"></div>

      <div className="hidden sm:flex italic text-sm">
        By The Boring Lab and inspired by
        <a
          className="hover:opacity-50 mx-1"
          href="https://twitter.com/mckaywrigley"
          target="_blank"
          rel="noreferrer"
        >
          Mckay Wrigley
        </a>
        .
      </div>

      <div className="flex space-x-4">
       
      </div>
    </div>
  );
};
