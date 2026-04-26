from __future__ import annotations

import json
import platform
import sys
from pathlib import Path
from typing import Optional

import httpx
import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(name="medtrace", help="MedTrace-SDK CLI — observability for clinical AI")
console = Console()

BASE_URL = "http://localhost:8765"


@app.command()
def version() -> None:
    """Print MedTrace-SDK and Python version info."""
    typer.echo(f"MedTrace-SDK v0.1.0-alpha")
    typer.echo(f"Python {platform.python_version()} ({sys.platform})")


@app.command()
def status() -> None:
    """Check if the MedTrace server is reachable."""
    try:
        resp = httpx.get(f"{BASE_URL}/health", timeout=5.0)
        data = resp.json()
        table = Table(title="MedTrace Server Status")
        table.add_column("Field", style="cyan")
        table.add_column("Value", style="green")
        for key, value in data.items():
            table.add_row(str(key), str(value))
        console.print(table)
    except httpx.ConnectError:
        typer.echo("✗ Server unreachable at http://localhost:8765", err=True)
        raise typer.Exit(code=1)
    except Exception as exc:
        typer.echo(f"✗ Error: {exc}", err=True)
        raise typer.Exit(code=1)


@app.command()
def export(
    start: str = typer.Option(..., help="Start date (YYYY-MM-DD)"),
    end: str = typer.Option(..., help="End date (YYYY-MM-DD)"),
    output: Path = typer.Option(
        Path("./audit_export.ndjson"), help="Output file path"
    ),
) -> None:
    """Export audit spans to an NDJSON file."""
    try:
        resp = httpx.get(
            f"{BASE_URL}/audit/export",
            params={"start": start, "end": end},
            timeout=30.0,
        )
        resp.raise_for_status()
        output.write_text(resp.text, encoding="utf-8")
        lines = resp.text.strip().splitlines()
        typer.echo(f"Exported {len(lines)} spans to {output}")
    except httpx.ConnectError:
        typer.echo("✗ Server unreachable — is medtrace-server running?", err=True)
        raise typer.Exit(code=1)
    except httpx.HTTPStatusError as exc:
        typer.echo(f"✗ Server returned {exc.response.status_code}", err=True)
        raise typer.Exit(code=1)


@app.command()
def replay(
    trace_id: str = typer.Argument(..., help="Trace ID to replay"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview without executing"),
) -> None:
    """Replay a specific trace by ID."""
    if dry_run:
        typer.echo(f"[dry-run] Would replay trace: {trace_id}")
        typer.echo(f"[dry-run] GET {BASE_URL}/traces/{trace_id}/replay")
        return
    try:
        resp = httpx.get(f"{BASE_URL}/traces/{trace_id}/replay", timeout=15.0)
        resp.raise_for_status()
        typer.echo(json.dumps(resp.json(), indent=2))
    except httpx.ConnectError:
        typer.echo("✗ Server unreachable — is medtrace-server running?", err=True)
        raise typer.Exit(code=1)
    except httpx.HTTPStatusError as exc:
        typer.echo(f"✗ Server returned {exc.response.status_code}", err=True)
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
