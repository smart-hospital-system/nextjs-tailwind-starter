import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-white dark:bg-gray-900">
      <main className="flex flex-col gap-[32px] row-start-2 items-center text-center max-w-4xl">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 dark:text-white">
            LMArena
          </h1>
          <div className="w-24 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-200">
            Next.js + TypeScript Starter
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Next.js, TypeScript, and Tailwind CSS Starter Repository
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 max-w-3xl">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Getting Started
          </h3>
          <ol className="text-left space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <span>
                Start by exploring the codebase structure and familiarizing
                yourself with the setup
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <span>
                Edit{" "}
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                  app/page.tsx
                </code>{" "}
                to begin implementing your solution
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </span>
              <span>
                A sample API route is available at{" "}
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                  /api/hello
                </code>{" "}
                for testing
              </span>
            </li>
          </ol>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Tech Stack Available
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
              Next.js 15
            </span>
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
              TypeScript
            </span>
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
              Tailwind CSS
            </span>
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
              React 19
            </span>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-gray-300 dark:border-gray-600 transition-colors flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 gap-2 hover:bg-gray-700 dark:hover:bg-gray-100 font-medium text-sm sm:text-base h-12 px-6 min-w-[160px]"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="Documentation icon"
              width={16}
              height={16}
              className="invert dark:invert-0"
            />
            Next.js Docs
          </a>
          <a
            className="rounded-full border border-solid border-gray-300 dark:border-gray-600 transition-colors flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm sm:text-base h-12 px-6 min-w-[160px] text-gray-700 dark:text-gray-300 gap-2"
            href="https://tailwindcss.com/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Tailwind icon"
              width={16}
              height={16}
            />
            Tailwind Docs
          </a>
        </div>
      </main>

      <footer className="row-start-3 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>LMArena Starter Repository</p>
      </footer>
    </div>
  );
}
