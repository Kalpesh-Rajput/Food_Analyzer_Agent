"""
Food Analyzer Agent — CLI Entry Point

Usage:
    python main.py --images path/to/image1.jpg path/to/image2.jpg
    python main.py --images ./sample_images/noodles.jpg --message "is this safe for kids?"
    python main.py --demo   (uses bundled sample images)
"""

import os
import sys
import time
from pathlib import Path
from typing import Optional, List

import typer
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.rule import Rule
from rich.progress import Progress, SpinnerColumn, TextColumn
from dotenv import load_dotenv

# Load .env before importing agent (agent needs OPENAI_API_KEY)
load_dotenv()

from agent.graph import food_analyzer
from agent.state import FoodAgentState
from utils.image_utils import validate_image_paths

# ─────────────────────────────────────────────────────────────────────────────
app = typer.Typer(
    name="food-analyzer",
    help="🥗 AI-powered food label analyzer — know what you're eating!",
    add_completion=False,
)
console = Console()
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_PROVIDER = os.environ.get("LLM_PROVIDER", "openai")

def check_api_key(provider: str) -> bool:
    """Verify required API key is set based on provider."""

    if provider == "openai":
        key = os.environ.get("OPENAI_API_KEY", "")
        if not key or key.startswith("your_"):
            console.print(
                Panel(
                    "[bold red]❌ OPENAI_API_KEY not set![/bold red]\n\n"
                    "Add this to your .env file:\n"
                    "[green]OPENAI_API_KEY=sk-...[/green]\n\n"
                    "Get it from: https://platform.openai.com/",
                    title="Setup Required",
                    border_style="red",
                )
            )
            return False

    elif provider == "anthropic":
        key = os.environ.get("OPENAI_API_KEY", "")
        if not key or key.startswith("your_"):
            console.print(
                Panel(
                    "[bold red]❌ OPENAI_API_KEY not set![/bold red]\n\n"
                    "Add this to your .env file:\n"
                    "[green]OPENAI_API_KEY=sk-...[/green]\n\n"
                    "Get it from: https://platform.openai.com/",
                    title="Setup Required",
                    border_style="red",
                )
            )
            return False

    else:
        console.print(f"[red]❌ Unknown provider: {provider}[/red]")
        return False

    return True


def print_banner():
    """Print the app banner."""
    console.print()
    console.print(
        Panel(
            Text.assemble(
                ("🥗 FOOD ANALYZER AGENT\n", "bold yellow"),
                ("Powered by LangGraph + Claude Vision\n", "dim"),
                ("─────────────────────────────\n", "dim"),
                ("Know what you're putting in your body.", "italic"),
            ),
            border_style="yellow",
            padding=(1, 4),
        )
    )
    console.print()


def print_result(result: dict):
    """Pretty-print the final result to terminal."""
    final = result.get("final_response", "No response generated.")
    product = result.get("product_name", "Unknown Product")
    analysis = result.get("food_analysis", {})

    console.print(Rule("[bold yellow]🤖 ANALYSIS RESULT[/bold yellow]"))
    console.print()

    verdict = analysis.get("overall_verdict", "UNKNOWN") if analysis else "UNKNOWN"
    color_map = {
        "HEALTHY": "green",
        "OKAY": "yellow",
        "UNHEALTHY": "red",
        "JUNK": "red",
        "UNKNOWN": "dim",
    }
    panel_color = color_map.get(verdict, "dim")

    console.print(
        Panel(
            final,
            title=f"[bold {panel_color}]{product}[/bold {panel_color}]",
            border_style=panel_color,
            padding=(1, 2),
        )
    )
    console.print()

    if analysis and analysis.get("harmful_ingredients"):
        console.print("[bold red]⚠️  Harmful Ingredients Detail:[/bold red]")
        for item in analysis["harmful_ingredients"]:
            console.print(
                f"   [red]•[/red] [bold]{item.get('name', '')}[/bold]: "
                f"[dim]{item.get('why_harmful', '')}[/dim]"
            )
        console.print()

    if analysis and analysis.get("fun_comparisons"):
        console.print("[bold cyan]📊 Quick Numbers:[/bold cyan]")
        for comp in analysis["fun_comparisons"]:
            console.print(f"   [cyan]•[/cyan] {comp}")
        console.print()

    console.print(Rule(style="dim"))


@app.command()
def analyze(
    images: List[str] = typer.Option(
        ...,
        "--images", "-i",
        help="Path(s) to food label image(s). E.g: --images label1.jpg label2.jpg",
    ),
    message: Optional[str] = typer.Option(
        None,
        "--message", "-m",
        help="Optional: add a specific question or context",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose", "-v",
        help="Show detailed node-by-node progress",
    ),
):
    if not check_api_key(DEFAULT_PROVIDER):
        raise typer.Exit(1)

    print_banner()

    console.print(f"[dim]📁 Checking {len(images)} image(s)...[/dim]")
    valid_images = validate_image_paths(images)

    if not valid_images:
        console.print("[bold red]❌ No valid images found. Please check the file paths.[/bold red]")
        raise typer.Exit(1)

    console.print(f"[green]✅ {len(valid_images)} valid image(s) ready for analysis[/green]")
    if message:
        console.print(f"[dim]💬 User note: {message}[/dim]")
    console.print()

    initial_state: FoodAgentState = {
        "image_paths": valid_images,
        "user_message": message,
        "raw_ocr_text": "",
        "extracted_nutrition": None,
        "extracted_ingredients": None,
        "product_name": None,
        "food_analysis": None,
        "final_response": None,
        "error": None,
    }

    start_time = time.time()

    if not verbose:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("🔍 Analyzing food label...", total=None)
            
            try:
                result = food_analyzer.invoke(initial_state)
                progress.update(task, description="✅ Analysis complete!")
            except Exception as e:
                progress.stop()
                console.print(f"\n[bold red]❌ Agent error: {e}[/bold red]")
                if "AuthenticationError" in str(type(e)):
                    console.print("[dim]→ Check your OPENAI_API_KEY in .env[/dim]")
                raise typer.Exit(1)
    else:
        console.print("[dim]Running in verbose mode...[/dim]\n")
        result = None
        try:
            for event in food_analyzer.stream(initial_state):
                for node_name, node_output in event.items():
                    console.print(f"[dim cyan]  ↳ Node '{node_name}' completed[/dim cyan]")
            result = food_analyzer.invoke(initial_state)
        except Exception as e:
            console.print(f"\n[bold red]❌ Agent error: {e}[/bold red]")
            raise typer.Exit(1)

    elapsed = time.time() - start_time
    console.print(f"[dim]⏱  Completed in {elapsed:.1f}s[/dim]\n")

    print_result(result)


@app.command()
def demo():
    if not check_api_key(DEFAULT_PROVIDER):
        raise typer.Exit(1)

    sample_dir = Path("sample_images")
    demo_images = list(sample_dir.glob("*.jpg")) + list(sample_dir.glob("*.png"))

    if not demo_images:
        console.print(
            Panel(
                "[yellow]No demo images found.[/yellow]\n\n"
                "Add food label images to [cyan]./sample_images/[/cyan] and run again.\n"
                "Supported formats: .jpg, .png, .webp",
                title="Demo Setup",
                border_style="yellow",
            )
        )
        raise typer.Exit(0)

    console.print(f"[green]Found {len(demo_images)} demo image(s)[/green]")
    
    ctx = typer.Context(analyze)
    analyze(
        images=[str(p) for p in demo_images],
        message="Give me a complete health analysis",
        verbose=False,
    )


@app.command()
def interactive():
    if not check_api_key(DEFAULT_PROVIDER):
        raise typer.Exit(1)

    print_banner()
    console.print("[bold green]Interactive Mode[/bold green] — type 'quit' to exit\n")

    while True:
        console.print("[bold]Enter image path(s)[/bold] (comma-separated, or 'quit'):")
        user_input = input("  > ").strip()

        if user_input.lower() in ("quit", "exit", "q"):
            console.print("\n[dim]Bye! Eat healthy 🥦[/dim]")
            break

        if not user_input:
            console.print("[dim]No input. Try again.[/dim]\n")
            continue

        paths = [p.strip() for p in user_input.split(",") if p.strip()]
        
        console.print("[bold]Any specific question? (press Enter to skip):[/bold]")
        msg = input("  > ").strip() or None

        valid_paths = validate_image_paths(paths)
        if not valid_paths:
            console.print("[red]No valid images found. Check the paths.[/red]\n")
            continue

        initial_state: FoodAgentState = {
            "image_paths": valid_paths,
            "user_message": msg,
            "raw_ocr_text": "",
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": None,
            "food_analysis": None,
            "final_response": None,
            "error": None,
        }

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("🔍 Analyzing...", total=None)
            try:
                result = food_analyzer.invoke(initial_state)
                progress.update(task, description="✅ Done!")
            except Exception as e:
                progress.stop()
                console.print(f"[red]Error: {e}[/red]")
                continue

        print_result(result)
        console.print()


if __name__ == "__main__":
    app()