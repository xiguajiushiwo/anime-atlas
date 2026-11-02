from pathlib import Path
import shutil
import zipfile

project = Path(__file__).resolve().parents[1]
destination = Path(r'C:\Users\Administrator\Documents\Codex\2026-10-28\https-lishirenwu-html2-link-https-lishirenwu\outputs\anime-atlas')
destination.mkdir(parents=True, exist_ok=True)
allowed_directories = {'public', 'data', 'server', 'worker', 'scripts', 'tests', 'migrations', 'docs'}
allowed_files = {'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'wrangler.jsonc', 'schema.sql', 'README.md', 'VALIDATION.md', 'CHARACTER_ROSTER.md', '.gitignore', '.gitattributes'}
archive = destination / 'anime-atlas-source.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as package:
    for source in sorted(project.rglob('*')):
        if not source.is_file():
            continue
        relative = source.relative_to(project)
        if relative.parts[0] not in allowed_directories and relative.as_posix() not in allowed_files:
            continue
        if source.name == 'package-delivery.py':
            continue
        package.write(source, 'anime-atlas/' + relative.as_posix())
shutil.copyfile(project / 'README.md', destination / '使用与部署说明.md')
shutil.copyfile(project / 'VALIDATION.md', destination / '验证记录.md')
shutil.copyfile(project / 'CHARACTER_ROSTER.md', destination / '角色精选名单.md')
shutil.copyfile(project / 'docs' / 'SALES_SETUP.md', destination / '密码售卖与发货配置.md')
shutil.copyfile(project / 'docs' / 'MATCHING.md', destination / '匹配与报告规则.md')
with zipfile.ZipFile(archive) as package:
    names = package.namelist()
    assert not any('/work/' in n or '/node_modules/' in n or '/.wrangler/' in n for n in names)
    assert 'anime-atlas/tests/fixtures/reachable.json' in names
    assert 'anime-atlas/tests/fixtures/reachable-standard.json' in names
    assert 'anime-atlas/tests/fixtures/reachable-60.json' in names
    assert 'anime-atlas/tests/fixtures/reachable-90.json' in names
    assert 'anime-atlas/server/analysis.mjs' in names
    assert 'anime-atlas/worker/index.mjs' in names
    assert 'anime-atlas/CHARACTER_ROSTER.md' in names
    assert 'anime-atlas/docs/SALES_SETUP.md' in names
    assert 'anime-atlas/migrations/2026-11-02-password-access.sql' in names
    assert 'anime-atlas/public/CHARACTER_ROSTER.md' not in names
    assert package.testzip() is None
    print(f'Packaged {len(names)} source files; {archive.stat().st_size} bytes. Local data, codes and dependencies excluded.')
