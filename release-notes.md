1. Rewrite the database related code to optimise the response time. For example, the resorting time for 10K paper items is decreased from 3s to 30ms.
2. Cache the preview image to optimise the rendering speed of paper preview.
3. Multi language support. Currently, English and Chinese are supported.
4. Redesigned the UI of Windows version.
5. Automatically detect and use the system proxy.
6. Added some guidance pages.
7. Redesigned the metadata scrapper pipeline and setting UI. For users who already used a custom scraper, you may need to modify the code of your scraper slightly. See Github for details.
8. Added two new scrapers: Paperlib Query Service (the server backend is still in progress), Semantic Scholar. We are constantly adding new scrapers, please contact me directly if you would like to optimise Paperlib for your research topic.
9. Optimise the launching speed, memory usage.
10. Optimise the performance of some metadata scrapers.
11. Moving files to trash instead of deleting files.
12. Add a progress bar to show some notifications such as downloading progress.
13. Now adding a paper in a subscribed feed will not download its PDF file.
14. Fixed some bugs.
